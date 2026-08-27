import rateLimit from 'express-rate-limit';
import { env } from '../config/env';

/**
 * Standard response when a client is rate-limited.
 * Matches the API's { success, error } envelope.
 */
function rateLimitHandler(_req: unknown, res: { status: (code: number) => { json: (body: unknown) => void } }): void {
  res.status(429).json({
    success: false,
    error: 'Too many requests — please try again later',
  });
}

// ── Global limiter ────────────────────────────────────────────────────────
// Applied to ALL traffic through the gateway.

export const globalLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxGlobal,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    // Use forwarded IP from gateway/proxy, fall back to socket IP.
    return (req.ip ?? req.socket.remoteAddress ?? 'unknown') as string;
  },
});

// ── Strict limiter ────────────────────────────────────────────────────────
// Applied to AI-powered endpoints (scoring, tailoring, interviews, roadmaps)
// where each request costs coins + LLM compute.

export const strictLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxStrict,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return (req.ip ?? req.socket.remoteAddress ?? 'unknown') as string;
  },
});

// ── Auth limiter ──────────────────────────────────────────────────────────
// Applied to login/session/logout to slow brute-force attempts.

export const authLimiter = rateLimit({
  windowMs: env.rateLimit.windowMs,
  max: env.rateLimit.maxAuth,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: rateLimitHandler,
  keyGenerator: (req) => {
    return (req.ip ?? req.socket.remoteAddress ?? 'unknown') as string;
  },
});
