import { Annotation, END, START, StateGraph } from '@langchain/langgraph';
import { extractAlgorithmicRequirements, extractAlgorithmicKeywords } from './graph';
import {
  CompactTailoredResumeSchema,
  type CompactTailoredResume,
  type ATSAnalysis,
  computeAtsAnalysis,
  injectMissingKeywords,
  preserveOriginalData,
  compactToFull,
} from './tailorSchemas';
import type { JobRequirements } from './schemas';

// ── Shared types ─────────────────────────────────────────────────────────────

interface KeywordData {
  mustIncludeKeywords: string[];
  coreSkills: string[];
  niceToHave: string[];
}

// ── Graph State ─────────────────────────────────────────────────────────────

const TailorGraphState = Annotation.Root({
  resumeText: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  jobDescription: Annotation<string>({ reducer: (_, b) => b, default: () => '' }),
  requirements: Annotation<JobRequirements | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  keywordData: Annotation<KeywordData | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  tailoredResume: Annotation<CompactTailoredResume | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
  atsAnalysis: Annotation<ATSAnalysis | null>({
    reducer: (_, b) => b,
    default: () => null,
  }),
});

type TailorState = typeof TailorGraphState.State;

// ── Algorithmic Resume Parser (text → CompactTailoredResume) ─────────────────

const SECTION_HEADERS = /^(summary|professional summary|objective|career objective|profile|about me|skills|technical skills|technologies|tech stack|tools|experience|work experience|employment|professional experience|projects|personal projects|education|academic|certifications|licenses|awards|references|interests)/i;

function parseResumeText(text: string): CompactTailoredResume {
  const lines = text.split('\n').map((l) => l.trim());
  const lower = text.toLowerCase();

  // Contact info
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]{7,15}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const portfolioMatch = text.match(/(?:portfolio|github\.com|gitlab\.com)\/[\w-]+/i);

  // Name: first line that isn't email/phone/url/section header
  let fullName = '';
  for (const line of lines.slice(0, 5)) {
    if (!line || line.includes('@') || line.match(/\d{6,}/) || line.startsWith('http') || line.length > 80) continue;
    if (SECTION_HEADERS.test(line)) break;
    if (line.split(' ').length <= 6) { fullName = line; break; }
  }

  // Location: line containing common city/state keywords
  let location = '';
  const locPatterns = /\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|gurgaon|gurugram|noida|remote|india|usa|uk|canada|singapore|california|new york|london|toronto|berlin|san francisco|seattle|austin|boston|chicago)\b/i;
  for (const line of lines.slice(0, 10)) {
    if (locPatterns.test(line)) { location = line.slice(0, 60); break; }
  }

  // Split into sections
  const sections: Record<string, string[]> = {};
  let currentSection = '_preamble';
  sections[currentSection] = [];

  for (const line of lines) {
    if (!line) continue;
    if (SECTION_HEADERS.test(line) && line.length < 40) {
      const key = line.toLowerCase().replace(/[:\s]+$/, '').trim();
      currentSection = key;
      if (!sections[currentSection]) sections[currentSection] = [];
      continue;
    }
    sections[currentSection].push(line);
  }

  // Parse skills
  const skillLines = [
    ...(sections['skills'] ?? []),
    ...(sections['technical skills'] ?? []),
    ...(sections['technologies'] ?? []),
    ...(sections['tech stack'] ?? []),
    ...(sections['tools'] ?? []),
  ];
  const skills: string[] = [];
  for (const sl of skillLines) {
    const parts = sl.split(/[,|•·:;]/);
    for (const p of parts) {
      const cleaned = p.trim().replace(/^[-•*]\s*/, '');
      if (cleaned.length > 1 && cleaned.length < 40 && !cleaned.match(/^\d/)) {
        skills.push(cleaned);
      }
    }
  }

  // Parse summary
  const summaryLines = [
    ...(sections['summary'] ?? []),
    ...(sections['professional summary'] ?? []),
    ...(sections['objective'] ?? []),
    ...(sections['career objective'] ?? []),
    ...(sections['profile'] ?? []),
    ...(sections['about me'] ?? []),
  ];
  const summary = summaryLines.join(' ').slice(0, 300);

  // Parse experience
  const expLines = [
    ...(sections['experience'] ?? []),
    ...(sections['work experience'] ?? []),
    ...(sections['employment'] ?? []),
    ...(sections['professional experience'] ?? []),
  ];
  const experience = parseExperienceEntries(expLines);

  // Parse education
  const eduLines = [
    ...(sections['education'] ?? []),
    ...(sections['academic'] ?? []),
  ];
  const education = parseEducationEntries(eduLines);

  // Parse projects
  const projLines = sections['projects'] ?? sections['personal projects'] ?? [];
  const projects = parseProjectEntries(projLines);

  // Parse certifications
  const certLines = sections['certifications'] ?? sections['licenses'] ?? [];
  const certifications = parseCertEntries(certLines);

  return {
    fullName,
    email: emailMatch?.[0] || '',
    phone: phoneMatch?.[0]?.trim() || '',
    location,
    linkedin: linkedinMatch?.[0] || '',
    portfolio: portfolioMatch?.[0] || '',
    summary: summary || `Experienced professional with expertise in ${skills.slice(0, 3).join(', ')}.`,
    skills: skills.length > 0 ? skills : extractSkillsFromFreeText(text),
    experience,
    education,
    projects: (projects ?? []).length > 0 ? projects : undefined,
    certifications: (certifications ?? []).length > 0 ? certifications : undefined,
  };
}

const DATE_RANGE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{4}\s*[-–—to]+\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{4})\b/i;
const DATE_ONLY = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{4}\b/i;
const BULLET = /^\s*[-•*●]\s+/;

function parseExperienceEntries(lines: string[]): CompactTailoredResume['experience'] {
  const entries: CompactTailoredResume['experience'] = [];
  if (lines.length === 0) return entries;

  let currentRole = '';
  let currentCompany = '';
  let currentDates = '';
  let currentBullets: string[] = [];

  for (const line of lines) {
    if (BULLET.test(line)) {
      currentBullets.push(line.replace(BULLET, '').trim());
      continue;
    }
    if (DATE_RANGE.test(line) || (DATE_ONLY.test(line) && line.length < 60)) {
      // Save previous entry
      if (currentRole || currentBullets.length > 0) {
        entries.push({
          role: currentRole || 'Software Developer',
          company: currentCompany,
          dates: currentDates,
          bullets: currentBullets.slice(0, 4),
        });
      }
      currentBullets = [];
      currentDates = (line.match(DATE_RANGE) || line.match(DATE_ONLY))?.[0] || '';
      // Everything before the date is role + company
      const before = line.replace(DATE_RANGE, '').replace(DATE_ONLY, '').replace(/[|,–—]/, ' at ').trim();
      const atMatch = before.match(/^(.+?)\s+at\s+(.+)$/i) || before.match(/^(.+?)\s*[|–—]\s*(.+)$/);
      if (atMatch) {
        currentRole = atMatch[1].trim();
        currentCompany = atMatch[2].trim();
      } else {
        currentRole = before || 'Software Developer';
        currentCompany = '';
      }
    } else if (line.length > 5 && line.length < 100 && !currentDates) {
      // Could be a role/company header
      const atMatch = line.match(/^(.+?)\s+at\s+(.+)$/i) || line.match(/^(.+?)\s*[|–—]\s*(.+)$/);
      if (atMatch) {
        if (currentRole || currentBullets.length > 0) {
          entries.push({
            role: currentRole || 'Software Developer',
            company: currentCompany,
            dates: currentDates,
            bullets: currentBullets.slice(0, 4),
          });
          currentBullets = [];
        }
        currentRole = atMatch[1].trim();
        currentCompany = atMatch[2].trim();
      }
    }
  }

  // Push last entry
  if (currentRole || currentBullets.length > 0) {
    entries.push({
      role: currentRole || 'Software Developer',
      company: currentCompany,
      dates: currentDates,
      bullets: currentBullets.slice(0, 4),
    });
  }

  // If no experience parsed, create one from preamble or generic
  if (entries.length === 0) {
    entries.push({ role: 'Software Developer', company: '', dates: '', bullets: ['Contributed to software development projects'] });
  }

  return entries;
}

function parseEducationEntries(lines: string[]): CompactTailoredResume['education'] {
  const entries: CompactTailoredResume['education'] = [];
  if (lines.length === 0) return entries;

  for (const line of lines) {
    if (line.length < 5) continue;
    const dateMatch = line.match(DATE_RANGE) || line.match(DATE_ONLY);
    const date = dateMatch?.[0] || '';
    const cleaned = line.replace(DATE_RANGE, '').replace(DATE_ONLY, '').replace(/[|,–—]/, ' at ').trim();

    const degreeMatch = cleaned.match(/^(.+?)\s+(?:at|from)\s+(.+)$/i) || cleaned.match(/^(.+?)\s*[|–—]\s*(.+)$/);
    if (degreeMatch) {
      entries.push({
        institution: degreeMatch[2].trim(),
        degree: degreeMatch[1].trim(),
        dates: date,
      });
    } else if (/\b(b\.?tech|m\.?tech|b\.?sc|m\.?sc|bachelor|master|mba|phd|degree|b\.?e\.?|m\.?e\.?)\b/i.test(cleaned)) {
      entries.push({ institution: '', degree: cleaned, dates: date });
    }
  }

  if (entries.length === 0) {
    const text = lines.join(' ');
    const degreeMatch = text.match(/\b(b\.?tech|m\.?tech|b\.?sc|m\.?sc|bachelor|master|mba|phd)\b/i);
    entries.push({ institution: '', degree: degreeMatch?.[0] || 'Computer Science', dates: '' });
  }

  return entries;
}

function parseProjectEntries(lines: string[]): CompactTailoredResume['projects'] {
  const entries: CompactTailoredResume['projects'] = [];
  for (const line of lines) {
    if (line.length < 5) continue;
    const descMatch = line.match(/^(.+?)[:–—]\s*(.+)$/);
    if (descMatch) {
      entries.push({ name: descMatch[1].trim(), description: descMatch[2].trim().slice(0, 120), tech: [] });
    }
  }
  return entries;
}

function parseCertEntries(lines: string[]): CompactTailoredResume['certifications'] {
  const entries: CompactTailoredResume['certifications'] = [];
  for (const line of lines) {
    if (line.length < 5) continue;
    const byMatch = line.match(/^(.+?)\s+(?:by|from|issued by)\s+(.+)$/i) || line.match(/^(.+?)\s*[|–—]\s*(.+)$/);
    if (byMatch) {
      entries.push({ name: byMatch[1].trim(), issuer: byMatch[2].trim() });
    } else {
      entries.push({ name: line, issuer: '' });
    }
  }
  return entries;
}

function extractSkillsFromFreeText(text: string): string[] {
  const lower = text.toLowerCase();
  const ALL_SKILLS = [
    'javascript','typescript','react','node.js','nodejs','python','java','c++','c#','go','golang','rust',
    'ruby','php','swift','kotlin','sql','mongodb','postgresql','mysql','redis','docker','kubernetes',
    'aws','azure','gcp','html','css','git','graphql','rest','api','next.js','nextjs','vue','angular',
    'express','django','flask','spring','jest','cypress','playwright','webpack','vite',
    'machine learning','ai','tensorflow','pytorch','linux','bash','agile','scrum','jira',
  ];
  return ALL_SKILLS.filter((s) => lower.includes(s));
}

// ── Algorithmic Tailoring Engine ─────────────────────────────────────────────

function tailorResume(resume: CompactTailoredResume, requirements: JobRequirements, keywordData: KeywordData, jdText: string): CompactTailoredResume {
  const result = { ...resume };

  // 1. Reorder skills: JD-required skills first, then original skills
  const jdLower = requirements.hardSkills.map((s) => s.toLowerCase());
  const kwLower = keywordData.coreSkills.map((s) => s.toLowerCase());
  const mustLower = keywordData.mustIncludeKeywords.map((s) => s.toLowerCase());

  const prioritized: string[] = [];
  const rest: string[] = [];

  for (const skill of result.skills) {
    const sl = skill.toLowerCase();
    const isPriority = jdLower.some((j) => sl.includes(j) || j.includes(sl)) ||
                       kwLower.some((k) => sl.includes(k) || k.includes(sl)) ||
                       mustLower.some((m) => sl.includes(m) || m.includes(sl));
    if (isPriority) {
      if (!prioritized.some((p) => p.toLowerCase() === sl)) prioritized.push(skill);
    } else {
      rest.push(skill);
    }
  }

  // 2. Add missing hard skills to skills array
  for (const hs of requirements.hardSkills) {
    const hsl = hs.toLowerCase();
    if (!result.skills.some((s) => s.toLowerCase().includes(hsl) || hsl.includes(s.toLowerCase()))) {
      prioritized.push(hs);
    }
  }

  // 3. Add core JD keywords
  for (const kw of keywordData.coreSkills) {
    const kwl = kw.toLowerCase();
    if (!prioritized.some((s) => s.toLowerCase().includes(kwl)) && !rest.some((s) => s.toLowerCase().includes(kwl))) {
      prioritized.push(kw);
    }
  }

  result.skills = [...prioritized, ...rest].slice(0, 15);

  // 4. Enhance summary with JD keywords
  const missingInSummary = keywordData.coreSkills.filter((k) => !result.summary.toLowerCase().includes(k.toLowerCase()));
  if (missingInSummary.length > 0 && result.summary.length < 250) {
    result.summary = result.summary.replace(/\.$/, '') + ` Skilled in ${missingInSummary.slice(0, 3).join(', ')}.`;
  }

  // 5. Weave keywords into experience bullets
  const allKws = [...new Set([...requirements.hardSkills, ...keywordData.coreSkills, ...keywordData.mustIncludeKeywords])];
  result.experience = result.experience.map((exp) => {
    const newBullets = [...exp.bullets];
    for (const kw of allKws.slice(0, 8)) {
      const kwl = kw.toLowerCase();
      if (newBullets.some((b) => b.toLowerCase().includes(kwl))) continue;

      // Find a short bullet to enhance
      for (let i = 0; i < newBullets.length; i++) {
        if (newBullets[i].length < 80 && !newBullets[i].toLowerCase().includes(kwl)) {
          const enhanced = `${newBullets[i]} using ${kw}`;
          if (enhanced.length < 120) {
            newBullets[i] = enhanced;
            break;
          }
        }
      }
    }
    return { ...exp, bullets: newBullets.slice(0, 4) };
  });

  return result;
}

// ── Graph Nodes (all algorithmic) ────────────────────────────────────────────

function extractNode(state: TailorState): Partial<TailorState> {
  const requirements = extractAlgorithmicRequirements(state.jobDescription);
  const keywordData = extractAlgorithmicKeywords(state.jobDescription);
  return { requirements, keywordData };
}

function tailorNode(state: TailorState): Partial<TailorState> {
  const resume = parseResumeText(state.resumeText);
  const tailored = tailorResume(resume, state.requirements!, state.keywordData!, state.jobDescription);
  return { tailoredResume: tailored };
}

function postProcessNode(state: TailorState): Partial<TailorState> {
  if (!state.tailoredResume || !state.requirements) return {};

  // Step 1: Preserve ALL original data from the resume
  let preserved = preserveOriginalData(state.tailoredResume, state.resumeText);

  // Step 2: Compute ATS score
  let atsAnalysis = computeAtsAnalysis(
    preserved,
    state.requirements,
    state.jobDescription,
    state.keywordData as any
  );

  // Step 3: Loop — inject missing keywords until score is 95+ or no more to inject
  let iterations = 0;
  while (atsAnalysis.missingKeywords.length > 0 && iterations < 5) {
    preserved = injectMissingKeywords(preserved, atsAnalysis.missingKeywords, state.requirements);
    atsAnalysis = computeAtsAnalysis(preserved, state.requirements, state.jobDescription, state.keywordData as any);
    iterations++;
  }

  return { tailoredResume: preserved, atsAnalysis };
}

// ── Graph Assembly ──────────────────────────────────────────────────────────

const workflow = new StateGraph(TailorGraphState)
  .addNode('extract', extractNode)
  .addNode('tailor', tailorNode)
  .addNode('post_process', postProcessNode)
  .addEdge(START, 'extract')
  .addEdge('extract', 'tailor')
  .addEdge('tailor', 'post_process')
  .addEdge('post_process', END);

const tailorGraph = workflow.compile();

export async function runResumeTailoring(
  resumeText: string,
  jobDescription: string
): Promise<{ tailoredResume: CompactTailoredResume; atsAnalysis: ATSAnalysis; fullResume: ReturnType<typeof compactToFull> }> {
  const finalState = await tailorGraph.invoke({ resumeText, jobDescription });

  if (!finalState.tailoredResume) throw new Error('Tailoring produced no result');
  if (!finalState.requirements) throw new Error('Requirements extraction failed');
  if (!finalState.atsAnalysis) throw new Error('ATS analysis failed');

  const fullResume = compactToFull(finalState.tailoredResume);

  return {
    tailoredResume: finalState.tailoredResume,
    atsAnalysis: finalState.atsAnalysis,
    fullResume,
  };
}
