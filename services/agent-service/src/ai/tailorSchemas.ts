import { z } from 'zod';
import { JobRequirementsSchema, type JobRequirements } from './schemas';

// ── ATSAnalysis type (computed algorithmically, no LLM) ─────────────────────

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

// ── Compact Resume Schema (fewer output tokens) ─────────────────────────────

export const CompactTailoredResumeSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin: z.string(),
  portfolio: z.string(),
  summary: z.string().describe('2-3 sentence professional summary'),
  skills: z.array(z.string()).describe('Skills prioritized by JD relevance'),
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

function computeAtsAnalysis(
  resume: CompactTailoredResume,
  requirements: JobRequirements,
  jdText: string
): ATSAnalysis {
  const text = flattenResumeText(resume);
  const jdLower = jdText.toLowerCase();

  const allKeywords = [...new Set([...requirements.keywords, ...requirements.hardSkills, ...requirements.softSkills])];
  const matched = allKeywords.filter((kw) => text.includes(kw.toLowerCase()));
  const missing = allKeywords
    .filter((kw) => !text.includes(kw.toLowerCase()))
    .map((kw) => ({ keyword: kw, reason: `Not found in resume` }));

  const keywordMatch = allKeywords.length > 0 ? Math.round((matched.length / allKeywords.length) * 100) : 75;

  const matchedRequired = requirements.hardSkills.filter((s) => text.includes(s.toLowerCase()));
  const requiredSkills = requirements.hardSkills.length > 0
    ? Math.round((matchedRequired.length / requirements.hardSkills.length) * 100) : 75;

  const matchedPreferred = requirements.softSkills.filter((s) => text.includes(s.toLowerCase()));
  const preferredSkills = requirements.softSkills.length > 0
    ? Math.round((matchedPreferred.length / requirements.softSkills.length) * 100) : 65;

  const allBullets = resume.experience.flatMap((e) => e.bullets);
  const actionVerbs = ['led', 'built', 'designed', 'implemented', 'developed', 'launched', 'reduced', 'increased', 'improved', 'optimized', 'created', 'managed', 'delivered', 'achieved', 'drove', 'automated', 'migrated', 'spearheaded'];
  const withVerbs = allBullets.filter((b) => actionVerbs.some((v) => b.toLowerCase().startsWith(v)));
  const withNumbers = allBullets.filter((b) => /\d+/.test(b));
  const achievementRelevance = allBullets.length > 0
    ? Math.round(((withVerbs.length * 0.5 + withNumbers.length * 0.5) / allBullets.length) * 100) : 55;

  const roleText = resume.experience.map((e) => e.role.toLowerCase()).join(' ');
  const titleWords = requirements.roleTitle.toLowerCase().split(/\s+/).filter((w) => w.length > 2);
  const titleHits = titleWords.filter((w) => roleText.includes(w));
  const experienceRelevance = Math.min(100, 40 + (titleHits.length * 15) + (resume.experience.length > 0 ? 20 : 0) + (achievementRelevance > 60 ? 15 : 0));
  const jobTitleAlignment = titleWords.length > 0 ? Math.round((titleHits.length / titleWords.length) * 100) : 55;

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

  const overallScore = Math.min(100, Math.round(
    keywordMatch * 0.25 + requiredSkills * 0.25 + experienceRelevance * 0.20 +
    achievementRelevance * 0.15 + atsFormatting * 0.08 + completeness * 0.07
  ));

  const recommendations: string[] = [];
  if (keywordMatch < 70) recommendations.push(`Add more JD keywords — only ${matched.length}/${allKeywords.length} matched`);
  if (withNumbers.length < 3) recommendations.push('Add quantified achievements with specific numbers/metrics');
  if (allBullets.length < 5) recommendations.push('Add more achievement bullets to experience sections');
  if (missing.length > 3) recommendations.push(`Consider adding: ${missing.slice(0, 3).map((k) => k.keyword).join(', ')}`);
  if (resume.skills.length < 5) recommendations.push('Add more relevant skills to the skills section');

  return {
    overallScore,
    breakdown: { keywordMatch, requiredSkills, preferredSkills, experienceRelevance, jobTitleAlignment, achievementRelevance, atsFormatting, resumeCompleteness: completeness },
    matchedKeywords: matched.slice(0, 25),
    missingKeywords: missing.slice(0, 10),
    recommendations: recommendations.slice(0, 5),
  };
}

// ── Type conversion ─────────────────────────────────────────────────────────

function compactToFull(c: CompactTailoredResume) {
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

export { computeAtsAnalysis, compactToFull, CompactTailoredResumeSchema as TailoredResumeSchema };
