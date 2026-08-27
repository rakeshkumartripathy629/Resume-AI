import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────

export const objectIdParam = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(20).optional().default(10),
});

// ── Start Interview ───────────────────────────────────────────────────────

export const startInterviewSchema = z
  .object({
    role: z
      .string()
      .min(2, 'role must be at least 2 characters')
      .max(150, 'role must not exceed 150 characters'),
    difficulty: z.enum(['easy', 'medium', 'hard']).optional().default('medium'),
    jdText: z.string().max(20_000).optional().default(''),
    missingSkills: z.array(z.string().max(100)).max(20).optional().default([]),
    roadmapId: z.string().max(50).optional(),
    questionCount: z.number().int().min(4).max(10).optional(),
  })
  .strict();

// ── Submit Answer ─────────────────────────────────────────────────────────

export const submitAnswerSchema = z
  .object({
    questionIndex: z.number().int().min(0, 'questionIndex must be >= 0'),
    answer: z
      .string()
      .min(10, 'answer must be at least 10 characters')
      .max(10_000, 'answer must not exceed 10,000 characters'),
  })
  .strict();
