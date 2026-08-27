import { z } from 'zod';

// ── Shared ────────────────────────────────────────────────────────────────

export const objectIdParam = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

// ── Generate Roadmap ──────────────────────────────────────────────────────

export const generateRoadmapSchema = z
  .object({
    targetRole: z
      .string()
      .min(2, 'targetRole must be at least 2 characters')
      .max(150, 'targetRole must not exceed 150 characters'),
    experienceLevel: z
      .enum(['beginner', 'intermediate', 'advanced'])
      .optional()
      .default('beginner'),
    currentSkills: z.array(z.string().max(100)).max(30).optional().default([]),
  })
  .strict();
