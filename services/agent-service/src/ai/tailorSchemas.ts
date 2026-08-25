import { z } from 'zod';
import { JobRequirementsSchema, type JobRequirements } from './schemas';

// ── ATSAnalysis interface (computed algorithmically) ─────────────────────────

export interface ATSAnalysis {
  overallScore: number;
  breakdown: {
    keywordMatch: number;
    requiredSkills: number;
    preferredSkills: number;
    experienceRelevance: number;
    jobTitleAlignment: number;
    achievementRelevance: number;
    atsFormatting: number;
    resumeCompleteness: number;
  };
  matchedKeywords: string[];
  missingKeywords: { keyword: string; reason: string }[];
  recommendations: string[];
}

// ── Compact Resume Schema ───────────────────────────────────────────────────

export const CompactTailoredResumeSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin: z.string(),
  portfolio: z.string(),
  summary: z.string().describe('2-3 sentence professional summary'),
  skills: z.array(z.string()).describe('Skills prioritized by JD relevance — MUST include all mandatory keywords'),
  experience: z.array(z.object({
    role: z.string(),
    company: z.string(),
    dates: z.string(),
    bullets: z.array(z.string()).max(4),
  })),
  education: z.array(z.object({
    institution: z.string(),
    degree: z.string(),
    dates: z.string(),
  })),
  projects: z.array(z.object({
    name: z.string(),
    description: z.string().max(120),
    tech: z.array(z.string()),
  })).optional(),
  certifications: z.array(z.object({
    name: z.string(),
    issuer: z.string(),
  })).optional(),
});
export type CompactTailoredResume = z.infer<typeof CompactTailoredResumeSchema>;

// ── Keyword extraction schema ───────────────────────────────────────────────

export const KeywordExtractionSchema = z.object({
  mustIncludeKeywords: z.array(z.string()).describe('All keywords that MUST appear in the tailored resume for high ATS match'),
  roleTitleVariants: z.array(z.string()).describe('Alternate ways to express the job title'),
  coreSkills: z.array(z.string()).describe('Top 5-8 most critical skills/technologies'),
  niceToHave: z.array(z.string()).describe('Optional but good-to-have keywords'),
});
export type KeywordExtraction = z.infer<typeof KeywordExtractionSchema>;

// ── Algorithmic ATS Scorer ──────────────────────────────────────────────────

function flattenResumeText(r: CompactTailoredResume): string {
  return [
    r.fullName,
    r.summary,
    r.skills.join(' '),
    r.experience.map((e) => `${e.role} ${e.company} ${e.bullets.join(' ')}`).join(' '),
    (r.projects ?? []).map((p) => `${p.name} ${p.description} ${p.tech.join(' ')}`).join(' '),
    (r.certifications ?? []).map((c) => `${c.name} ${c.issuer}`).join(' '),
    (r.education ?? []).map((e) => `${e.degree} ${e.institution}`).join(' '),
  ].join(' ').toLowerCase();
}

export function computeAtsAnalysis(
  resume: CompactTailoredResume,
  requirements: JobRequirements,
  jdText: string,
  keywordData?: { mustIncludeKeywords?: string[]; coreSkills?: string[] }
): ATSAnalysis {
  const text = flattenResumeText(resume);

  // Build master keyword list from all sources
  const allKeywords = [
    ...new Set([
      ...requirements.keywords,
      ...requirements.hardSkills,
      ...requirements.softSkills,
      ...(keywordData?.mustIncludeKeywords ?? []),
      ...(keywordData?.coreSkills ?? []),
    ]),
  ];

  // Match each keyword (case-insensitive, partial match for multi-word)
  const matched: string[] = [];
  const missing: { keyword: string; reason: string }[] = [];

  for (const kw of allKeywords) {
    const kwLower = kw.toLowerCase().trim();
    if (kwLower.length < 2) continue;

    const words = kwLower.split(/\s+/);
    const allWordsPresent = words.every((w) => {
      if (w.length < 2) return true;
      const regex = new RegExp(`\\b${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'i');
      return regex.test(text);
    });

    if (allWordsPresent || text.includes(kwLower)) {
      matched.push(kw);
    } else {
      missing.push({ keyword: kw, reason: `Not found in resume` });
    }
  }

  const keywordMatch = allKeywords.length > 0 ? Math.round((matched.length / allKeywords.length) * 100) : 75;

  // Required skills coverage
  const matchedRequired = requirements.hardSkills.filter((s) => text.includes(s.toLowerCase()));
  const requiredSkills = requirements.hardSkills.length > 0
    ? Math.round((matchedRequired.length / requirements.hardSkills.length) * 100) : 75;

  // Soft skills coverage
  const matchedPreferred = requirements.softSkills.filter((s) => text.includes(s.toLowerCase()));
  const preferredSkills = requirements.softSkills.length > 0
    ? Math.round((matchedPreferred.length / requirements.softSkills.length) * 100) : 65;

  // Role title alignment
  const roleText = resume.experience.map((e) => e.role.toLowerCase()).join(' ');
  const jdTitle = requirements.roleTitle.toLowerCase();
  const titleWords = jdTitle.split(/\s+/).filter((w) => w.length > 2);
  const titleHits = titleWords.filter((w) => roleText.includes(w));
  const jobTitleAlignment = titleWords.length > 0 ? Math.round((titleHits.length / titleWords.length) * 100) : 55;

  // Achievement relevance
  const allBullets = resume.experience.flatMap((e) => e.bullets);
  const actionVerbs = ['led', 'built', 'designed', 'implemented', 'developed', 'launched', 'reduced', 'increased', 'improved', 'optimized', 'created', 'managed', 'delivered', 'achieved', 'drove', 'automated', 'migrated', 'spearheaded', 'engineered', 'architected'];
  const withVerbs = allBullets.filter((b) => actionVerbs.some((v) => b.toLowerCase().startsWith(v)));
  const withNumbers = allBullets.filter((b) => /\d+/.test(b));
  const achievementRelevance = allBullets.length > 0
    ? Math.min(100, Math.round(((withVerbs.length * 0.4 + withNumbers.length * 0.6) / allBullets.length) * 100 + (allBullets.length >= 6 ? 10 : 0))) : 50;

  const experienceRelevance = Math.min(100,
    30 + (titleHits.length * 12) + (resume.experience.length > 0 ? 20 : 0) + (achievementRelevance > 60 ? 20 : 0)
  );

  // Formatting completeness
  const hasContact = !!(resume.fullName && resume.email);
  const hasSummary = resume.summary.length > 30;
  const hasSkills = resume.skills.length >= 3;
  const hasExperience = resume.experience.length > 0;
  const hasEducation = resume.education.length > 0;
  const fmtScore = [hasContact, hasSummary, hasSkills, hasExperience, hasEducation].filter(Boolean).length;
  const atsFormatting = Math.round((fmtScore / 5) * 100);

  const completeness = Math.round(
    (hasContact ? 15 : 0) + (hasSummary ? 15 : 0) + (hasSkills ? 20 : 0) +
    (hasExperience ? 25 : 0) + (hasEducation ? 15 : 0) +
    ((resume.projects ?? []).length > 0 ? 5 : 0) + ((resume.certifications ?? []).length > 0 ? 5 : 0)
  );

  // Weighted overall
  let overallScore = Math.min(100, Math.round(
    keywordMatch * 0.35 +
    requiredSkills * 0.25 +
    experienceRelevance * 0.15 +
    achievementRelevance * 0.10 +
    atsFormatting * 0.08 +
    completeness * 0.07
  ));

  // When ALL keywords match, boost floor to 95 — this is a fully optimized resume
  if (missing.length === 0 && keywordMatch >= 90) {
    overallScore = Math.max(overallScore, 95);
  }

  const recommendations: string[] = [];
  if (missing.length > 0) recommendations.push(`Add these keywords: ${missing.slice(0, 5).map((k) => k.keyword).join(', ')}`);
  if (withNumbers.length < 3) recommendations.push('Add quantified achievements with specific metrics');
  if (allBullets.length < 5) recommendations.push('Add more achievement bullets to experience');
  if (resume.skills.length < 8) recommendations.push('Add more relevant skills to the skills section');
  if (jobTitleAlignment < 50) recommendations.push(`Align role titles closer to: ${requirements.roleTitle}`);

  return {
    overallScore,
    breakdown: {
      keywordMatch,
      requiredSkills,
      preferredSkills,
      experienceRelevance,
      jobTitleAlignment,
      achievementRelevance,
      atsFormatting,
      resumeCompleteness: completeness,
    },
    matchedKeywords: matched.slice(0, 30),
    missingKeywords: missing.slice(0, 15),
    recommendations: recommendations.slice(0, 5),
  };
}

// ── Post-processing: aggressive keyword injection ────────────────────────────

export function injectMissingKeywords(
  resume: CompactTailoredResume,
  missingKeywords: { keyword: string; reason: string }[],
  requirements: JobRequirements
): CompactTailoredResume {
  const result = JSON.parse(JSON.stringify(resume)) as CompactTailoredResume;
  const text = flattenResumeText(result).toLowerCase();

  // 1. Inject ALL missing hard skills into skills array
  for (const hs of requirements.hardSkills) {
    const hsl = hs.toLowerCase();
    if (!text.includes(hsl) && !result.skills.some((s) => s.toLowerCase().includes(hsl))) {
      result.skills.unshift(hs);
    }
  }

  // 2. Inject ALL missing soft skills into skills array
  for (const s of requirements.softSkills) {
    const sl = s.toLowerCase();
    if (!text.includes(sl) && !result.skills.some((sk) => sk.toLowerCase().includes(sl))) {
      result.skills.push(s);
    }
  }

  // 3. Inject missing keywords from ATS check
  for (const mk of missingKeywords) {
    const kwl = mk.keyword.toLowerCase();
    // Already in skills?
    if (result.skills.some((s) => s.toLowerCase().includes(kwl))) continue;

    // Add to skills
    result.skills.push(mk.keyword);

    // Also try to weave into an experience bullet
    for (const exp of result.experience) {
      for (let i = 0; i < exp.bullets.length; i++) {
        if (exp.bullets[i].length < 80 && !exp.bullets[i].toLowerCase().includes(kwl)) {
          const enhanced = `${exp.bullets[i]} using ${mk.keyword}`;
          if (enhanced.length < 130) {
            exp.bullets[i] = enhanced;
            break;
          }
        }
      }
    }
  }

  result.skills = [...new Set(result.skills)].slice(0, 20);

  // 4. Aggressively fill summary with ALL missing keywords
  const summaryMissing = [...requirements.hardSkills, ...requirements.softSkills, ...requirements.keywords]
    .filter((k) => !result.summary.toLowerCase().includes(k.toLowerCase()));

  if (summaryMissing.length > 0) {
    const addition = summaryMissing.slice(0, 5).join(', ');
    result.summary = result.summary.replace(/\.\s*$/, '').replace(/\.$/, '');
    if (result.summary.length + addition.length + 30 < 300) {
      result.summary += ` Proficient in ${addition}.`;
    }
  }

  // 5. Ensure experience bullets contain keywords
  const allMissing = [...requirements.hardSkills, ...requirements.keywords];
  for (const kw of allMissing) {
    const kwl = kw.toLowerCase();
    if (result.experience.some((e) => e.bullets.some((b) => b.toLowerCase().includes(kwl)))) continue;

    // Find any experience with a short bullet
    for (const exp of result.experience) {
      for (let i = 0; i < exp.bullets.length; i++) {
        if (exp.bullets[i].length < 70 && !exp.bullets[i].toLowerCase().includes(kwl)) {
          const enhanced = `${exp.bullets[i]} leveraging ${kw}`;
          if (enhanced.length < 130) {
            exp.bullets[i] = enhanced;
            break;
          }
        }
      }
    }
  }

  return result;
}

// ── Parse original resume text into structured data ─────────────────────────

const SEC_RE = /^(summary|professional summary|objective|profile|about me|skills|technical skills|technologies|tech stack|tools|experience|work experience|employment|professional experience|projects|personal projects|education|academic|certifications|licenses|awards|interests|references)/i;
const DATE_RANGE = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{4}\s*[-–—to]+\s*(?:present|current|(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{4})\b/i;
const DATE_ONLY = /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\w*\s*\d{4}\b/i;
const BULLET = /^\s*[-•*●▪]\s+/;

function parseOriginalResume(text: string): CompactTailoredResume {
  const lines = text.split('\n').map((l) => l.trim());

  // Contact
  const emailMatch = text.match(/[\w.+-]+@[\w-]+\.[\w.]+/);
  const phoneMatch = text.match(/[\+]?[\d\s\-\(\)]{7,15}/);
  const linkedinMatch = text.match(/linkedin\.com\/in\/[\w-]+/i);
  const portfolioMatch = text.match(/(?:portfolio|github\.com|gitlab\.com)\/[\w-]+/i);
  let fullName = '';
  for (const line of lines.slice(0, 5)) {
    if (!line || line.includes('@') || line.match(/\d{6,}/) || line.startsWith('http') || line.length > 80) continue;
    if (SEC_RE.test(line)) break;
    if (line.split(' ').length <= 6) { fullName = line; break; }
  }
  let location = '';
  for (const line of lines.slice(0, 10)) {
    if (/\b(bangalore|bengaluru|mumbai|delhi|hyderabad|pune|chennai|gurgaon|gurugram|noida|remote|india|usa|uk|canada|singapore|california|new york|london|toronto|berlin)\b/i.test(line)) {
      location = line.slice(0, 60); break;
    }
  }

  // Split into sections
  const sections: Record<string, string[]> = {};
  let current = '_preamble';
  sections[current] = [];
  for (const line of lines) {
    if (!line) continue;
    if (SEC_RE.test(line) && line.length < 40) {
      current = line.toLowerCase().replace(/[:\s]+$/, '').trim();
      if (!sections[current]) sections[current] = [];
      continue;
    }
    sections[current].push(line);
  }

  // Skills
  const skillLines = [...(sections['skills'] ?? []), ...(sections['technical skills'] ?? []), ...(sections['technologies'] ?? []), ...(sections['tech stack'] ?? []), ...(sections['tools'] ?? [])];
  const skills: string[] = [];
  for (const sl of skillLines) {
    for (const p of sl.split(/[,|•·:;]/)) {
      const c = p.trim().replace(/^[-•*]\s*/, '');
      if (c.length > 1 && c.length < 40 && !c.match(/^\d/)) skills.push(c);
    }
  }

  // Summary
  const summaryLines = [...(sections['summary'] ?? []), ...(sections['professional summary'] ?? []), ...(sections['objective'] ?? []), ...(sections['profile'] ?? []), ...(sections['about me'] ?? [])];
  const summary = summaryLines.join(' ').slice(0, 300);

  // Experience
  const expLines = [...(sections['experience'] ?? []), ...(sections['work experience'] ?? []), ...(sections['employment'] ?? []), ...(sections['professional experience'] ?? [])];
  const experience = parseExpEntries(expLines);

  // Education
  const eduLines = [...(sections['education'] ?? []), ...(sections['academic'] ?? [])];
  const education = parseEduEntries(eduLines);

  // Projects
  const projLines = [...(sections['projects'] ?? []), ...(sections['personal projects'] ?? [])];
  const projects = parseProjEntries(projLines);

  // Certifications
  const certLines = [...(sections['certifications'] ?? []), ...(sections['licenses'] ?? [])];
  const certifications = parseCertEntries(certLines);

  return {
    fullName, email: emailMatch?.[0] || '', phone: phoneMatch?.[0]?.trim() || '', location,
    linkedin: linkedinMatch?.[0] || '', portfolio: portfolioMatch?.[0] || '',
    summary: summary || `Professional with expertise in ${skills.slice(0, 3).join(', ')}.`,
    skills: skills.length > 0 ? skills : [],
    experience, education,
    projects: (projects ?? []).length > 0 ? projects : undefined,
    certifications: (certifications ?? []).length > 0 ? certifications : undefined,
  };
}

function parseExpEntries(lines: string[]): CompactTailoredResume['experience'] {
  const entries: CompactTailoredResume['experience'] = [];
  if (lines.length === 0) return entries;
  let role = '', company = '', dates = '', bullets: string[] = [];

  for (const line of lines) {
    if (BULLET.test(line)) { bullets.push(line.replace(BULLET, '').trim()); continue; }
    if (DATE_RANGE.test(line) || (DATE_ONLY.test(line) && line.length < 60)) {
      if (role || bullets.length > 0) { entries.push({ role: role || 'Professional', company, dates, bullets: bullets.slice(0, 4) }); bullets = []; }
      dates = (line.match(DATE_RANGE) || line.match(DATE_ONLY))?.[0] || '';
      const before = line.replace(DATE_RANGE, '').replace(DATE_ONLY, '').replace(/[|,–—]/, ' at ').trim();
      const m = before.match(/^(.+?)\s+at\s+(.+)$/i) || before.match(/^(.+?)\s*[|–—]\s*(.+)$/);
      role = m ? m[1].trim() : before || 'Professional';
      company = m ? m[2].trim() : '';
    } else if (line.length > 5 && line.length < 100 && !dates) {
      const m = line.match(/^(.+?)\s+at\s+(.+)$/i) || line.match(/^(.+?)\s*[|–—]\s*(.+)$/);
      if (m) {
        if (role || bullets.length > 0) { entries.push({ role: role || 'Professional', company, dates, bullets: bullets.slice(0, 4) }); bullets = []; }
        role = m[1].trim(); company = m[2].trim();
      }
    }
  }
  if (role || bullets.length > 0) entries.push({ role: role || 'Professional', company, dates, bullets: bullets.slice(0, 4) });
  if (entries.length === 0) entries.push({ role: 'Professional', company: '', dates: '', bullets: [] });
  return entries;
}

function parseEduEntries(lines: string[]): CompactTailoredResume['education'] {
  const entries: CompactTailoredResume['education'] = [];
  if (lines.length === 0) return entries;
  for (const line of lines) {
    if (line.length < 5) continue;
    const dateMatch = line.match(DATE_RANGE) || line.match(DATE_ONLY);
    const date = dateMatch?.[0] || '';
    const cleaned = line.replace(DATE_RANGE, '').replace(DATE_ONLY, '').replace(/[|,–—]/, ' at ').trim();
    const m = cleaned.match(/^(.+?)\s+(?:at|from)\s+(.+)$/i) || cleaned.match(/^(.+?)\s*[|–—]\s*(.+)$/);
    if (m) entries.push({ institution: m[2].trim(), degree: m[1].trim(), dates: date });
    else entries.push({ institution: '', degree: cleaned, dates: date });
  }
  if (entries.length === 0) entries.push({ institution: '', degree: 'Computer Science', dates: '' });
  return entries;
}

function parseProjEntries(lines: string[]): CompactTailoredResume['projects'] {
  const entries: CompactTailoredResume['projects'] = [];
  for (const line of lines) {
    if (line.length < 5) continue;
    const m = line.match(/^(.+?)[:–—]\s*(.+)$/);
    if (m) entries.push({ name: m[1].trim(), description: m[2].trim().slice(0, 120), tech: [] });
    else entries.push({ name: line, description: '', tech: [] });
  }
  return entries;
}

function parseCertEntries(lines: string[]): CompactTailoredResume['certifications'] {
  const entries: CompactTailoredResume['certifications'] = [];
  for (const line of lines) {
    if (line.length < 5) continue;
    const m = line.match(/^(.+?)\s+(?:by|from|issued by)\s+(.+)$/i) || line.match(/^(.+?)\s*[|–—]\s*(.+)$/);
    if (m) entries.push({ name: m[1].trim(), issuer: m[2].trim() });
    else entries.push({ name: line, issuer: '' });
  }
  return entries;
}

// ── Preserve original resume data — merges original into tailored ───────────

export function preserveOriginalData(
  tailored: CompactTailoredResume,
  originalText: string
): CompactTailoredResume {
  const original = parseOriginalResume(originalText);
  const result = { ...tailored };

  // ALWAYS use original contact info — user's real data
  if (original.fullName) result.fullName = original.fullName;
  if (original.email) result.email = original.email;
  if (original.phone) result.phone = original.phone;
  if (original.location) result.location = original.location;
  if (original.linkedin) result.linkedin = original.linkedin;
  if (original.portfolio) result.portfolio = original.portfolio;

  // Preserve original summary if we have nothing better
  if (!result.summary || result.summary.length < 20) {
    result.summary = original.summary;
  }

  // Merge original experience — keep ALL entries from both
  if (original.experience.length > 0) {
    const origRoles = original.experience.map((e) => `${e.role}|${e.company}`.toLowerCase());
    for (const origExp of original.experience) {
      const key = `${origExp.role}|${origExp.company}`.toLowerCase();
      if (!result.experience.some((e) => `${e.role}|${e.company}`.toLowerCase() === key)) {
        result.experience.push(origExp);
      } else {
        // Merge bullets from original into existing entry
        const existing = result.experience.find((e) => `${e.role}|${e.company}`.toLowerCase() === key);
        if (existing) {
          for (const bullet of origExp.bullets) {
            if (!existing.bullets.some((b) => b.toLowerCase() === bullet.toLowerCase())) {
              existing.bullets.push(bullet);
            }
          }
          existing.bullets = existing.bullets.slice(0, 4);
          if (!existing.dates && origExp.dates) existing.dates = origExp.dates;
        }
      }
    }
  }

  // Preserve original education
  if (original.education.length > 0 && result.education.length === 0) {
    result.education = original.education;
  } else if (original.education.length > result.education.length) {
    // Add missing education entries
    for (const origEdu of original.education) {
      if (!result.education.some((e) => e.degree === origEdu.degree && e.institution === origEdu.institution)) {
        result.education.push(origEdu);
      }
    }
  }

  // ALWAYS preserve original projects
  if (original.projects && original.projects.length > 0) {
    result.projects = original.projects;
  }

  // ALWAYS preserve original certifications
  if (original.certifications && original.certifications.length > 0) {
    result.certifications = original.certifications;
  }

  // Merge original skills — add any that are missing
  if (original.skills.length > 0) {
    const existingLower = result.skills.map((s) => s.toLowerCase());
    for (const origSkill of original.skills) {
      if (!existingLower.some((e) => e.includes(origSkill.toLowerCase()) || origSkill.toLowerCase().includes(e))) {
        result.skills.push(origSkill);
      }
    }
  }

  return result;
}

// ── Type conversion ─────────────────────────────────────────────────────────

export function compactToFull(c: CompactTailoredResume) {
  return {
    contact: { fullName: c.fullName, email: c.email, phone: c.phone, location: c.location, linkedin: c.linkedin || '', portfolio: c.portfolio || '' },
    summary: c.summary,
    skills: c.skills,
    experience: c.experience.map((e) => ({ role: e.role, company: e.company, startDate: e.dates, endDate: '', current: false, bullets: e.bullets })),
    education: c.education.map((e) => ({ institution: e.institution, degree: e.degree, field: '', startDate: e.dates, endDate: '', grade: '' })),
    projects: (c.projects ?? []).map((p) => ({ name: p.name, description: p.description, link: '', tech: p.tech })),
    certifications: (c.certifications ?? []).map((ct) => ({ name: ct.name, issuer: ct.issuer, date: '' })),
  };
}

export { JobRequirementsSchema, type JobRequirements };
