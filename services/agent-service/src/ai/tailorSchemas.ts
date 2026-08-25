import { z } from 'zod';

// ── Re-export existing schemas ──────────────────────────────────────────────

export {
  JobRequirementsSchema,
  MatchAnalysisSchema,
  ScoreResultSchema,
  type JobRequirements,
  type MatchAnalysis,
  type ScoreResult,
} from './schemas';

// ── Tailored Resume Schemas ─────────────────────────────────────────────────

export const TailoredContactSchema = z.object({
  fullName: z.string(),
  email: z.string(),
  phone: z.string(),
  location: z.string(),
  linkedin: z.string(),
  portfolio: z.string(),
});
export type TailoredContact = z.infer<typeof TailoredContactSchema>;

export const TailoredExperienceSchema = z.object({
  role: z.string().describe('Job title, aligned with JD terminology'),
  company: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  current: z.boolean(),
  bullets: z.array(z.string()).describe('Action-verb-led achievement bullets tailored to the JD'),
});
export type TailoredExperience = z.infer<typeof TailoredExperienceSchema>;

export const TailoredEducationSchema = z.object({
  institution: z.string(),
  degree: z.string(),
  field: z.string(),
  startDate: z.string(),
  endDate: z.string(),
  grade: z.string(),
});
export type TailoredEducation = z.infer<typeof TailoredEducationSchema>;

export const TailoredProjectSchema = z.object({
  name: z.string(),
  description: z.string().describe('Brief project description, relevant to JD'),
  tech: z.array(z.string()),
});
export type TailoredProject = z.infer<typeof TailoredProjectSchema>;

export const TailoredCertificationSchema = z.object({
  name: z.string(),
  issuer: z.string(),
  date: z.string(),
});
export type TailoredCertification = z.infer<typeof TailoredCertificationSchema>;

export const TailoredResumeSchema = z.object({
  contact: TailoredContactSchema,
  summary: z.string().describe('2-4 sentence professional summary tailored to the target role'),
  skills: z.array(z.string()).describe('Skills prioritized by JD relevance'),
  experience: z.array(TailoredExperienceSchema).describe('Experience with tailored bullets'),
  education: z.array(TailoredEducationSchema),
  projects: z.array(TailoredProjectSchema),
  certifications: z.array(TailoredCertificationSchema),
});
export type TailoredResume = z.infer<typeof TailoredResumeSchema>;

// ── ATS Analysis Schema ─────────────────────────────────────────────────────

export const ATSScoreBreakdownSchema = z.object({
  keywordMatch: z.number().min(0).max(100),
  requiredSkills: z.number().min(0).max(100),
  preferredSkills: z.number().min(0).max(100),
  experienceRelevance: z.number().min(0).max(100),
  jobTitleAlignment: z.number().min(0).max(100),
  achievementRelevance: z.number().min(0).max(100),
  atsFormatting: z.number().min(0).max(100),
  resumeCompleteness: z.number().min(0).max(100),
});

export const ATSAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  breakdown: ATSScoreBreakdownSchema,
  matchedKeywords: z.array(z.string()).max(30).describe('Keywords present in tailored resume'),
  missingKeywords: z
    .array(z.object({
      keyword: z.string(),
      reason: z.string().describe('Why this keyword is missing and whether it can be safely added'),
    }))
    .max(15),
  recommendations: z.array(z.string()).max(6).describe('Top actionable recommendations'),
});
export type ATSAnalysis = z.infer<typeof ATSAnalysisSchema>;

// ── Tailor Result Schema ────────────────────────────────────────────────────

export const TailorResultSchema = z.object({
  tailoredResume: TailoredResumeSchema,
  atsAnalysis: ATSAnalysisSchema,
  originalSummary: z.string().describe('Brief summary of original resume quality'),
  tailoringNotes: z.array(z.string()).max(8).describe('Key changes made during tailoring'),
});
export type TailorResult = z.infer<typeof TailorResultSchema>;
