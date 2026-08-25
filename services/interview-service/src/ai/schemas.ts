import { z } from 'zod';

export const QuestionPlanSchema = z.object({
  questions: z
    .array(
      z.object({
        text: z.string().describe('The interview question'),
        type: z.enum(['technical', 'behavioral', 'situational']),
        targetSkill: z.string().describe('The specific skill or topic this question tests (e.g. "React hooks", "system design", "communication")'),
      })
    )
    .min(4)
    .max(10),
});
export type QuestionPlan = z.infer<typeof QuestionPlanSchema>;

export const AnswerEvaluationSchema = z.object({
  score: z.number().min(0).max(10).describe('Answer quality out of 10'),
  strengths: z.array(z.string()).max(4).describe('What was good in the answer'),
  gaps: z.array(z.string()).max(4).describe('What was missing or weak'),
  modelAnswerHint: z.string().describe('One or two sentences on what a great answer covers'),
});
export type AnswerEvaluation = z.infer<typeof AnswerEvaluationSchema>;

export const InterviewReportSchema = z.object({
  overallScore: z.number().min(0).max(100),
  band: z.enum(['excellent', 'good', 'average', 'needs_improvement']),
  summary: z.string(),
  competencyScores: z.object({
    technical: z.number().min(0).max(100),
    communication: z.number().min(0).max(100),
    problemSolving: z.number().min(0).max(100),
    confidence: z.number().min(0).max(100),
  }),
  skillProficiencies: z.record(z.string(), z.number().min(0).max(100)).describe('Proficiency score (0-100) for each skill that was targeted by interview questions. Key = skill name, value = proficiency score.'),
  strengths: z.array(z.string()).max(6),
  improvements: z.array(z.string()).max(6),
});
export type InterviewReportResult = z.infer<typeof InterviewReportSchema>;
