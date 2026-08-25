import { z } from 'zod';

export const JobRequirementsSchema = z.object({
  roleTitle: z.string().describe('Job title'),
  seniority: z.string().describe('junior / mid / senior / staff'),
  hardSkills: z.array(z.string()).max(10).describe('Required technical skills'),
  softSkills: z.array(z.string()).max(5).describe('Soft skills'),
  keywords: z.array(z.string()).max(15).describe('ATS keywords'),
});
export type JobRequirements = z.infer<typeof JobRequirementsSchema>;

export const MatchAnalysisSchema = z.object({
  matchedSkills: z.array(z.string()).max(10),
  missingSkills: z.array(z.string()).max(10),
  hasQuantifiedAchievements: z.boolean(),
  evidenceNotes: z.string().describe('Brief evidence notes'),
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
  summary: z.string().describe('2-3 sentence summary'),
  strengths: z.array(z.string()).max(4),
  improvements: z.array(z.string()).max(5).describe('Actionable suggestions'),
  missingKeywords: z.array(z.string()).max(10),
  verdict: z.enum(['strong_match', 'good', 'needs_work', 'poor']),
});
export type ScoreResult = z.infer<typeof ScoreResultSchema>;
