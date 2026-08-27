import { z } from 'zod';

// ── Create Order ──────────────────────────────────────────────────────────

export const createOrderSchema = z
  .object({
    planId: z.string().min(1, 'planId is required').max(50),
  })
  .strict();

// ── Verify Payment ────────────────────────────────────────────────────────

export const verifyPaymentSchema = z
  .object({
    razorpayOrderId: z.string().min(1, 'razorpayOrderId is required').max(100),
    razorpayPaymentId: z.string().min(1, 'razorpayPaymentId is required').max(100),
    razorpaySignature: z.string().min(1, 'razorpaySignature is required').max(200),
  })
  .strict();
