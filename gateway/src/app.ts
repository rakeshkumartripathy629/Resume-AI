import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestContext } from './middleware/requestContext';
import { globalLimiter, strictLimiter, authLimiter } from './middleware/rateLimit';
import { blockInternalPaths, mountProxies } from './routes/proxy';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(
    cors({
      origin: env.clientOrigins,
      credentials: true,
    })
  );

  app.use(requestContext);

  // Parse JSON before proxies; fixRequestBody re-forwards consumed bodies.
  app.use(express.json({ limit: '5mb' }));
  app.use(blockInternalPaths);

  // ── Health endpoints (no rate limit) ──────────────────────────────────
  app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
  });

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: { service: 'gateway', status: 'ok', uptime: process.uptime() },
    });
  });

  // ── Global rate limit (all API traffic) ───────────────────────────────
  app.use('/api', globalLimiter);

  // ── Strict rate limit (AI-powered endpoints) ──────────────────────────
  // Resume scoring, tailoring, PDF generation, interviews, roadmaps.
  app.use('/api/v1/agent/score', strictLimiter);
  app.use('/api/v1/agent/tailor', strictLimiter);
  app.use('/api/v1/agent/generate-pdf', strictLimiter);
  app.use('/api/v1/interviews', strictLimiter);
  app.use('/api/v1/roadmaps', strictLimiter);

  // ── Auth rate limit (session, login, logout) ─────────────────────────
  app.use('/api/v1/auth', authLimiter);

  mountProxies(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
