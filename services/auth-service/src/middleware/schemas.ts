import { z } from 'zod';

// ── Auth ──────────────────────────────────────────────────────────────────

export const createSessionSchema = z
  .object({
    idToken: z.string().min(1, 'idToken is required').max(2048),
  })
  .strict();

// ── Coins ─────────────────────────────────────────────────────────────────

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(50).optional().default(15),
});

export const internalConsumeSchema = z
  .object({
    uid: z.string().min(1, 'uid is required'),
    action: z.string().min(1, 'action is required'),
    meta: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

export const internalCreditSchema = z
  .object({
    uid: z.string().min(1, 'uid is required'),
    amount: z.number().int().refine((n) => n !== 0, 'amount must be non-zero'),
    reason: z.string().min(1, 'reason is required'),
    meta: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();

// ── Admin ─────────────────────────────────────────────────────────────────

export const adminPaginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(20),
  search: z.string().max(200).optional().default(''),
  sort: z.string().max(50).optional().default('createdAt'),
  order: z.enum(['asc', 'desc']).optional().default('desc'),
  status: z.string().max(30).optional().default(''),
});

export const objectIdParam = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');

export const adjustCoinsSchema = z
  .object({
    amount: z.number().int().refine((n) => n !== 0, 'amount must be non-zero'),
    reason: z.string().max(500).optional().default(''),
  })
  .strict();
