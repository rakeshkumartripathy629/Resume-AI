/**
 * Production combined server — plain JS, no tsx needed.
 * All 6 services in ONE process. Runs from compiled dist/ directories.
 */

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const mongoose = require('mongoose');
const { createClient } = require('redis');
const { randomUUID } = require('crypto');
const path = require('path');
const fs = require('fs');

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
  req.requestId = req.headers['x-request-id'] || randomUUID();
  next();
});

// Billing webhook raw body
app.post('/api/v1/billing/webhook/razorpay', express.raw({ type: 'application/json' }));

// API placeholder while services load
let routesReady = false;
app.use('/api/*', (_req, res, next) => {
  if (routesReady) return next();
  res.status(503).json({ success: false, error: 'Service starting up, try again in 5 seconds' });
});

// Health check — IMMEDIATE
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

// Serve frontend
const clientDist = path.join(__dirname, 'client', 'dist');
const hasFrontend = fs.existsSync(clientDist);

if (hasFrontend) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api/') || req.path.startsWith('/internal/') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(clientDist, 'index.html'));
  });
  console.log('📁 Frontend loaded');
} else {
  console.log('⚠️  client/dist not found');
  app.get('/', (_req, res) => res.json({ status: 'ok', api: 'combined-server' }));
}

// Start server IMMEDIATELY
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Server on port ' + PORT);
});

// Internal server for inter-service calls
const internalApp = express();
internalApp.use(express.json({ limit: '1mb' }));
const internalServer = internalApp.listen(4001, '0.0.0.0', () => {
  console.log('✅ Internal on port 4001');
});

// ── Load services (compiled JS from dist/) ────────────────────────────

async function loadServices() {
  try {
    console.log('⏳ Connecting MongoDB...');
    await mongoose.connect(MONGODB_URI, { serverSelectionTimeoutMS: 15000 });
    console.log('✅ MongoDB connected');
  } catch (err) {
    console.error('❌ MongoDB failed:', err.message);
    return;
  }

  try {
    const redisClient = createClient({ url: REDIS_URL });
    redisClient.on('error', () => {});
    await redisClient.connect();
    console.log('✅ Redis connected');
  } catch {
    console.log('⚠️  Redis unavailable');
  }

  try {
    // Auth
    console.log('⏳ Loading auth...');
    const authRoutes = require('./services/auth-service/dist/routes/auth.routes').default;
    const coinRoutes = require('./services/auth-service/dist/routes/coin.routes').default;
    const adminRoutes = require('./services/auth-service/dist/routes/admin.routes').default;
    const coinsController = require('./services/auth-service/dist/controllers/coins.controller');
    const { asyncHandler, notFoundHandler, errorHandler } = require('./services/auth-service/dist/middleware/errorHandler');

    app.use('/api/v1/auth', authRoutes);
    app.use('/api/v1/coins', coinRoutes);
    app.use('/api/v1/admin', adminRoutes);
    app.post('/internal/coins/consume', asyncHandler(coinsController.internalConsumeController));
    app.post('/internal/coins/credit', asyncHandler(coinsController.internalCreditController));
    internalApp.post('/internal/coins/consume', asyncHandler(coinsController.internalConsumeController));
    internalApp.post('/internal/coins/credit', asyncHandler(coinsController.internalCreditController));
    internalApp.get('/internal/ping', (_req, res) => res.json({ success: true, data: { ok: true } }));
    console.log('  ✅ auth');

    // Agent
    console.log('⏳ Loading agent...');
    const agentRoutes = require('./services/agent-service/dist/routes/agent.routes').default;
    const resumeRoutes = require('./services/agent-service/dist/routes/resume.routes').default;
    app.use('/api/v1/agent', agentRoutes);
    app.use('/api/v1/resumes', resumeRoutes);
    console.log('  ✅ agent');

    // Interview
    console.log('⏳ Loading interview...');
    const interviewRoutes = require('./services/interview-service/dist/routes/interview.routes').default;
    app.use('/api/v1/interviews', interviewRoutes);
    console.log('  ✅ interview');

    // Roadmap
    console.log('⏳ Loading roadmap...');
    const roadmapRoutes = require('./services/roadmap-service/dist/routes/roadmap.routes').default;
    app.use('/api/v1/roadmaps', roadmapRoutes);
    console.log('  ✅ roadmap');

    // Billing
    console.log('⏳ Loading billing...');
    const billingRoutes = require('./services/billing-service/dist/routes/billing.routes').default;
    const billingController = require('./services/billing-service/dist/controllers/billing.controller');
    app.use('/api/v1/billing', billingRoutes);
    app.post('/api/v1/billing/webhook/razorpay', (req, res, next) => {
      billingController.webhookController(req.body, req, res).catch(next);
    });
    console.log('  ✅ billing');

    // Ready
    routesReady = true;
    app.use(notFoundHandler);
    app.use(errorHandler);

    console.log('\n✅ All services loaded!\n');
  } catch (err) {
    console.error('❌ Failed to load services:', err.message);
    console.error(err.stack);
  }
}

loadServices().catch((err) => {
  console.error('❌ Failed to load:', err.message);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 Shutting down...');
  server.close(() => {
    internalServer.close(() => {
      mongoose.disconnect().then(() => process.exit(0));
    });
  });
  setTimeout(() => process.exit(1), 10000).unref();
});
process.on('SIGINT', () => process.emit('SIGTERM'));
