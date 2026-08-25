import { z } from 'zod';

export const JobRequirementsSchema = z.object({
  roleTitle: z.string().describe('Job title from the posting'),
  seniority: z.string().describe('Seniority level, e.g. junior / mid / senior / staff'),
  hardSkills: z.array(z.string()).max(15).describe('Technical skills the role requires'),
  softSkills: z.array(z.string()).max(8).describe('Soft skills emphasized in the posting'),
  keywords: z
    .array(z.string())
    .max(25)
    .describe('Important ATS keywords, tools, methodologies, certifications'),
});
export type JobRequirements = z.infer<typeof JobRequirementsSchema>;

export const MatchAnalysisSchema = z.object({
  matchedSkills: z.array(z.string()).max(20),
  missingSkills: z.array(z.string()).max(15),
  matchedKeywords: z.array(z.string()).max(30),
  missingKeywords: z.array(z.string()).max(20),
  hasQuantifiedAchievements: z.boolean(),
  formattingIssues: z.array(z.string()).max(8),
  evidenceNotes: z.string().describe('Short notes citing concrete resume evidence'),
});
export type MatchAnalysis = z.infer<typeof MatchAnalysisSchema>;

export const ScoreResultSchema = z.object({
  overallScore: z.number().min(0).max(100),
  categoryScores: z.object({
    keywordMatch: z.number().min(0).max(100),
    skillsRelevance: z.number().min(0).max(100),
    experienceImpact: z.number().min(0).max(100),
    formattingClarity: z.number().min(0).max(100),
  }),
  summary: z.string().describe('2-3 sentence executive summary of the match'),
  strengths: z.array(z.string()).max(6),
  improvements: z.array(z.string()).max(8).describe('Prioritized, actionable suggestions'),
  missingKeywords: z.array(z.string()).max(15),
  verdict: z.enum(['strong_match', 'good', 'needs_work', 'poor']),
});
export type ScoreResult = z.infer<typeof ScoreResultSchema>;
