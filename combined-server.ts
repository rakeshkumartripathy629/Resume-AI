/**
 * Combined single-process server for Render free tier (512MB).
 * Backend API + Frontend static files — everything in one process.
 */

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import { createClient } from 'redis';
import { randomUUID } from 'crypto';
import path from 'path';
import fs from 'fs';

// ── Load env ──────────────────────────────────────────────────────────

const PORT = parseInt(process.env.PORT || '10000', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-builder';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const clientOrigins = CLIENT_ORIGIN.split(',').map((s) => s.trim());
const SESSION_TTL = parseInt(process.env.SESSION_TTL_SECONDS || '604800', 10);

process.env.PORT = String(PORT);
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.MONGODB_URI = MONGODB_URI;
process.env.REDIS_URL = REDIS_URL;
process.env.CLIENT_ORIGIN = CLIENT_ORIGIN;
process.env.SESSION_TTL_SECONDS = String(SESSION_TTL);

// ── Bootstrap ─────────────────────────────────────────────────────────

async function bootstrap() {
  // 1. Connect MongoDB
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 10000 });
  console.log('✅ MongoDB connected');

  // 2. Connect Redis (optional)
  let redisClient: ReturnType<typeof createClient> | null = null;
  try {
    redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', () => {});
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch {
    console.log('⚠️  Redis unavailable');
  }

  // 3. Express app
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1);
  app.use(helmet({ contentSecurityPolicy: false }));
  app.use(cors({ origin: clientOrigins, credentials: true }));
  app.use(express.json({ limit: '5mb' }));
  app.use((req, _res, next) => {
    (req as any).requestId = req.headers['x-request-id'] || randomUUID();
    next();
  });

  // ── Billing webhook (raw body — before JSON parser) ─────────────────
  app.post('/api/v1/billing/webhook/razorpay', express.raw({ type: 'application/json' }));

  // ── Health check ────────────────────────────────────────────────────
  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: {
        service: 'combined-server',
        status: 'ok',
        uptime: process.uptime(),
        mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
      },
    });
  });

  // ── API Routes ──────────────────────────────────────────────────────

  // Auth
  const authRoutes = await import('./services/auth-service/src/routes/auth.routes');
  const coinRoutes = await import('./services/auth-service/src/routes/coin.routes');
  const adminRoutes = await import('./services/auth-service/src/routes/admin.routes');
  const coinsController = await import('./services/auth-service/src/controllers/coins.controller');
  const { asyncHandler, notFoundHandler, errorHandler } = await import('./services/auth-service/src/middleware/errorHandler');

  app.use('/api/v1/auth', authRoutes.default);
  app.use('/api/v1/coins', coinRoutes.default);
  app.use('/api/v1/admin', adminRoutes.default);

  // Agent
  const agentRoutes = await import('./services/agent-service/src/routes/agent.routes');
  const resumeRoutes = await import('./services/agent-service/src/routes/resume.routes');
  app.use('/api/v1/agent', agentRoutes.default);
  app.use('/api/v1/resumes', resumeRoutes.default);

  // Interview
  const interviewRoutes = await import('./services/interview-service/src/routes/interview.routes');
  app.use('/api/v1/interviews', interviewRoutes.default);

  // Roadmap
  const roadmapRoutes = await import('./services/roadmap-service/src/routes/roadmap.routes');
  app.use('/api/v1/roadmaps', roadmapRoutes.default);

  // Billing
  const billingRoutes = await import('./services/billing-service/src/routes/billing.routes');
  const billingController = await import('./services/billing-service/src/controllers/billing.controller');
  app.use('/api/v1/billing', billingRoutes.default);

  // Razorpay webhook handler
  app.post('/api/v1/billing/webhook/razorpay', (req, res, next) => {
    void billingController.webhookController(req.body as Buffer, req, res).catch(next);
  });

  // Internal routes (coins consume/credit for inter-service calls)
  app.post('/internal/coins/consume', asyncHandler(coinsController.internalConsumeController));
  app.post('/internal/coins/credit', asyncHandler(coinsController.internalCreditController));
  app.get('/internal/ping', (_req, res) => res.json({ success: true, data: { ok: true } }));

  console.log('✅ All API routes mounted');

  // ── Serve frontend (client/dist) ────────────────────────────────────
  const clientDist = path.join(__dirname, 'client', 'dist');

  if (fs.existsSync(clientDist)) {
    app.use(express.static(clientDist));
    // SPA fallback — all non-API routes serve index.html
    app.get('*', (req, res, next) => {
      if (req.path.startsWith('/api/') || req.path.startsWith('/internal/') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(clientDist, 'index.html'));
    });
    console.log('✅ Frontend served from client/dist');
  } else {
    console.log('⚠️  client/dist not found — frontend not served');
    app.get('/', (_req, res) => {
      res.json({ status: 'ok', service: 'combined-server (API only)' });
    });
  }

  // 404 + error handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  // ── Internal app (port 4001) for inter-service HTTP calls ───────────
  const internalApp = express();
  internalApp.use(express.json({ limit: '1mb' }));
  internalApp.get('/internal/ping', (_req, res) => res.json({ success: true, data: { ok: true } }));
  internalApp.post('/internal/coins/consume', asyncHandler(coinsController.internalConsumeController));
  internalApp.post('/internal/coins/credit', asyncHandler(coinsController.internalCreditController));

  // ── Start servers ───────────────────────────────────────────────────
  const server = app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Server running on port ${PORT}`);
  });

  const internalServer = internalApp.listen(4001, '0.0.0.0', () => {
    console.log(`✅ Internal server on port 4001\n`);
  });

  // ── Graceful shutdown ───────────────────────────────────────────────
  function shutdown(signal: string) {
    console.log(`\n🛑 ${signal} received, shutting down...`);
    server.close(() => {
      internalServer.close(() => {
        mongoose.disconnect().then(() => {
          if (redisClient) redisClient.quit();
          process.exit(0);
        });
      });
    });
    setTimeout(() => process.exit(1), 10000).unref();
  }

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

bootstrap().catch((err) => {
  console.error('❌ Failed to start:', err);
  process.exit(1);
});
