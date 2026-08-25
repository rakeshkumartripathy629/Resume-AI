import { z } from 'zod';

export const GapAnalysisSchema = z.object({
  matchingSkills: z.array(z.string()).max(20).describe('Current skills already relevant to the target role'),
  missingSkills: z.array(z.string()).max(25).describe('Critical skills to acquire, priority order'),
  notes: z.string().describe('Two or three sentences summarizing the gap'),
});
export type GapAnalysis = z.infer<typeof GapAnalysisSchema>;

export const RoadmapPhasesSchema = z.object({
  phases: z
    .array(
      z.object({
        title: z.string().describe('Phase name, e.g. "Foundations" or "Portfolio depth"'),
        duration: z.string().describe('Estimated duration like "4-6 weeks"'),
        skills: z.array(z.string()).max(8).describe('Skills to learn in this phase'),
        milestones: z
          .array(z.string())
          .max(5)
          .describe('Concrete, checkable outcomes for this phase'),
        resources: z
          .array(
            z.object({
              title: z.string(),
              type: z.enum(['course', 'book', 'docs', 'project', 'other']),
            })
          )
          .max(4)
          .describe('Well-known learning resources or project ideas'),
      })
    )
    .min(3)
    .max(6),
});
export type RoadmapPhasesResult = z.infer<typeof RoadmapPhasesSchema>;

export interface FullRoadmap {
  gapAnalysis: GapAnalysis;
  phases: RoadmapPhasesResult['phases'];
}
