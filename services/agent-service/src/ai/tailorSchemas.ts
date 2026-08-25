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
    r.summary,
    r.skills.join(' '),
    r.experience.map((e) => `${e.role} ${e.bullets.join(' ')}`).join(' '),
    (r.projects ?? []).map((p) => `${p.name} ${p.description} ${p.tech.join(' ')}`).join(' '),
    (r.certifications ?? []).map((c) => `${c.name} ${c.issuer}`).join(' '),
  ].join(' ').toLowerCase();
}

export function computeAtsAnalysis(
  resume: CompactTailoredResume,
  requirements: JobRequirements,
  jdText: string,
  keywordData?: KeywordExtraction
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

    // Check exact match or word-boundary match
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

  // Experience relevance — role title alignment
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

  // Weighted overall — keywords are king for ATS
  const overallScore = Math.min(100, Math.round(
    keywordMatch * 0.35 +
    requiredSkills * 0.25 +
    experienceRelevance * 0.15 +
    achievementRelevance * 0.10 +
    atsFormatting * 0.08 +
    completeness * 0.07
  ));

  // Recommendations
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

// ── Post-processing: inject missing keywords ────────────────────────────────

export function injectMissingKeywords(
  resume: CompactTailoredResume,
  missingKeywords: { keyword: string; reason: string }[],
  requirements: JobRequirements
): CompactTailoredResume {
  const text = flattenResumeText(resume);
  const result = { ...resume };

  // Inject missing hard skills into skills array
  const missingHard = requirements.hardSkills.filter(
    (s) => !text.includes(s.toLowerCase()) && !result.skills.some((sk) => sk.toLowerCase().includes(s.toLowerCase()))
  );
  if (missingHard.length > 0) {
    result.skills = [...missingHard, ...result.skills];
  }

  // Inject missing soft skills into skills array
  const missingSoft = requirements.softSkills.filter(
    (s) => !text.includes(s.toLowerCase()) && !result.skills.some((sk) => sk.toLowerCase().includes(s.toLowerCase()))
  );
  if (missingSoft.length > 0 && result.skills.length < 15) {
    result.skills = [...result.skills, ...missingSoft].slice(0, 15);
  }

  // Try to inject missing keywords into experience bullets
  const newExperience = result.experience.map((exp) => {
    const newBullets = [...exp.bullets];
    for (const mk of missingKeywords.slice(0, 5)) {
      const kw = mk.keyword.toLowerCase();
      // Check if already present in any bullet
      const alreadyPresent = newBullets.some((b) => b.toLowerCase().includes(kw));
      if (alreadyPresent) continue;

      // Try to enhance an existing bullet with the keyword
      for (let i = 0; i < newBullets.length; i++) {
        const bullet = newBullets[i];
        if (bullet.length < 80 && !bullet.toLowerCase().includes(kw)) {
          // Only add if it makes contextual sense
          const enhancedBullet = `${bullet} utilizing ${mk.keyword}`;
          if (enhancedBullet.length < 120) {
            newBullets[i] = enhancedBullet;
            break;
          }
        }
      }
    }
    return { ...exp, bullets: newBullets };
  });

  result.experience = newExperience;

  // Inject missing keywords into summary if it's short enough
  const missingSummary = missingKeywords
    .filter((mk) => !result.summary.toLowerCase().includes(mk.keyword.toLowerCase()))
    .slice(0, 3);

  if (missingSummary.length > 0 && result.summary.length < 200) {
    const addition = missingSummary.map((mk) => mk.keyword).join(', ');
    result.summary = `${result.summary} Proficient in ${addition}.`;
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
