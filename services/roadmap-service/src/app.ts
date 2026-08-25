import express, { Express, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { asyncHandler, errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestContext } from './middleware/requestContext';
import roadmapRoutes from './routes/roadmap.routes';
import { isMongoReady } from './lib/mongoose';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  app.use(helmet());
  app.use(cors({ origin: env.clientOrigins, credentials: true }));
  app.use(requestContext);
  app.use(express.json({ limit: '1mb' }));

  app.get(
    '/health',
    asyncHandler(async (_req, res) => {
      res.json({
        success: true,
        data: {
          service: 'roadmap-service',
          status: 'ok',
          uptime: process.uptime(),
          llmConfigured: Boolean(env.openai.apiKey),
          dependencies: {
            mongodb: isMongoReady() ? 'connected' : 'disconnected',
          },
        },
      });
    })
  );

  app.use('/api/v1/roadmaps', roadmapRoutes);

  const internalRouter = Router();
  internalRouter.get('/ping', (_req, res) => {
    res.json({ success: true, data: { ok: true } });
  });
  app.use('/internal', internalRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
