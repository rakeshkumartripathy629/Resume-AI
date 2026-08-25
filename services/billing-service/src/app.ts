import express, { Express, Router } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env, isRazorpayConfigured } from './config/env';
import { asyncHandler, errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestContext } from './middleware/requestContext';
import billingRoutes from './routes/billing.routes';
import { webhookController } from './controllers/billing.controller';
import { isMongoReady } from './lib/mongoose';

export function createApp(): Express {
  const app = express();

  app.disable('x-powered-by');
  app.set('trust proxy', 1);

  // Webhook needs the raw body for signature verification — mount before express.json.
  app.post(
    '/api/v1/billing/webhook/razorpay',
    express.raw({ type: 'application/json' }),
    (req, res, next) => {
      void webhookController(req.body as Buffer, req, res).catch(next);
    }
  );

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
          service: 'billing-service',
          status: 'ok',
          uptime: process.uptime(),
          razorpayConfigured: isRazorpayConfigured(),
          dependencies: {
            mongodb: isMongoReady() ? 'connected' : 'disconnected',
          },
        },
      });
    })
  );

  app.use('/api/v1/billing', billingRoutes);

  const internalRouter = Router();
  internalRouter.get('/ping', (_req, res) => {
    res.json({ success: true, data: { ok: true } });
  });
  app.use('/internal', internalRouter);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
