import express, { Express, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { asyncHandler, errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestContext } from './middleware/requestContext';
import authRoutes from './routes/auth.routes';
import { isMongoReady } from './lib/mongoose';
import { isRedisReady } from './lib/redis';

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
          service: 'auth-service',
          status: 'ok',
          uptime: process.uptime(),
          dependencies: {
            mongodb: isMongoReady() ? 'connected' : 'disconnected',
            redis: (await isRedisReady()) ? 'connected' : 'disconnected',
          },
        },
      });
    })
  );

  app.use('/api/v1/auth', authRoutes);

  // Service-to-service routes (gateway blocks /internal/* from external traffic)
  const internalRouter = Router();
  internalRouter.get('/ping', (_req, res) => {
    res.json({ success: true, data: { ok: true } });
  });
  app.use('/internal', internalRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
