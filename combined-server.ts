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

const PORT = parseInt(process.env.PORT || '10000', 10);
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/resume-builder';
const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || 'http://localhost:5173';
const clientOrigins = CLIENT_ORIGIN.split(',').map((s) => s.trim());

process.env.PORT = String(PORT);
process.env.NODE_ENV = process.env.NODE_ENV || 'production';
process.env.MONGODB_URI = MONGODB_URI;
process.env.REDIS_URL = REDIS_URL;
process.env.CLIENT_ORIGIN = CLIENT_ORIGIN;
process.env.SESSION_TTL_SECONDS = process.env.SESSION_TTL_SECONDS || '604800';

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

// Billing webhook raw body (before JSON)
app.post('/api/v1/billing/webhook/razorpay', express.raw({ type: 'application/json' }));

// API placeholder while services load in background
let routesReady = false;
app.use('/api/*', (_req, res, next) => {
  if (routesReady) return next();
  res.status(503).json({ success: false, error: 'Service starting up, try again in 10 seconds' });
});

// Health — IMMEDIATE (Render port detection)
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

// Serve frontend STATIC FILES immediately
const clientDist = path.join(__dirname, 'client', 'dist');
const hasFrontend = fs.existsSync(clientDist);

if (hasFrontend) {
  app.use(express.static(clientDist));
  // SPA fallback — serve index.html for all non-API routes IMMEDIATELY
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/internal/') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('📁 Serving frontend from client/dist');
} else {
  console.log('⚠️  client/dist not found at', clientDist);
  // List what IS in /app for debugging
  try {
    const items = fs.readdirSync('/app');
    console.log('📂 /app contents:', items.join(', '));
    if (fs.existsSync('/app/client')) {
      const clientItems = fs.readdirSync('/app/client');
      console.log('📂 /app/client contents:', clientItems.join(', '));
    }
  } catch {}
}

// Start server IMMEDIATELY
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server listening on port ${PORT}`);
});

const internalApp = express();
internalApp.use(express.json({ limit: '1mb' }));
const internalServer = internalApp.listen(4001, '0.0.0.0', () => {
  console.log(`✅ Internal server on port 4001`);
});

// ── Load services in background ───────────────────────────────────────

async function loadServices() {
  console.log('⏳ Connecting to MongoDB...');
  await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
  console.log('✅ MongoDB connected');

  try {
    const redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', () => {});
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch {
    console.log('⚠️  Redis unavailable');
  }

  // Auth
  const authRoutes = await import('./services/auth-service/src/routes/auth.routes');
  const coinRoutes = await import('./services/auth-service/src/routes/coin.routes');
  const adminRoutes = await import('./services/auth-service/src/routes/admin.routes');
  const coinsController = await import('./services/auth-service/src/controllers/coins.controller');
  const { asyncHandler, notFoundHandler, errorHandler } = await import('./services/auth-service/src/middleware/errorHandler');

  app.use('/api/v1/auth', authRoutes.default);
  app.use('/api/v1/coins', coinRoutes.default);
  app.use('/api/v1/admin', adminRoutes.default);
  app.post('/internal/coins/consume', asyncHandler(coinsController.internalConsumeController));
  app.post('/internal/coins/credit', asyncHandler(coinsController.internalCreditController));
  internalApp.post('/internal/coins/consume', asyncHandler(coinsController.internalConsumeController));
  internalApp.post('/internal/coins/credit', asyncHandler(coinsController.internalCreditController));
  internalApp.get('/internal/ping', (_req, res) => res.json({ success: true, data: { ok: true } }));
  console.log('  ✅ auth');

  const agentRoutes = await import('./services/agent-service/src/routes/agent.routes');
  const resumeRoutes = await import('./services/agent-service/src/routes/resume.routes');
  app.use('/api/v1/agent', agentRoutes.default);
  app.use('/api/v1/resumes', resumeRoutes.default);
  console.log('  ✅ agent');

  const interviewRoutes = await import('./services/interview-service/src/routes/interview.routes');
  app.use('/api/v1/interviews', interviewRoutes.default);
  console.log('  ✅ interview');

  const roadmapRoutes = await import('./services/roadmap-service/src/routes/roadmap.routes');
  app.use('/api/v1/roadmaps', roadmapRoutes.default);
  console.log('  ✅ roadmap');

  const billingRoutes = await import('./services/billing-service/src/routes/billing.routes');
  const billingController = await import('./services/billing-service/src/controllers/billing.controller');
  app.use('/api/v1/billing', billingRoutes.default);
  app.post('/api/v1/billing/webhook/razorpay', (req, res, next) => {
    void billingController.webhookController(req.body as Buffer, req, res).catch(next);
  });
  console.log('  ✅ billing');

  // 404 + error (AFTER routes loaded)
  routesReady = true;
  app.use(notFoundHandler);
  app.use(errorHandler);

  console.log('\n✅ All services loaded!\n');
}

loadServices().catch((err) => {
  console.error('❌ Failed to load services:', err);
});

function shutdown(signal: string) {
  console.log(`\n🛑 ${signal}`);
  server.close(() => {
    internalServer.close(() => {
      mongoose.disconnect().then(() => process.exit(0));
    });
  });
  setTimeout(() => process.exit(1), 10000).unref();
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
