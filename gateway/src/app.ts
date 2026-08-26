import express, { Express } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { env } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { requestContext } from './middleware/requestContext';
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

  app.get('/', (_req, res) => {
    res.json({ status: 'ok', service: 'gateway' });
  });

  app.get('/health', (_req, res) => {
    res.json({
      success: true,
      data: { service: 'gateway', status: 'ok', uptime: process.uptime() },
    });
  });

  mountProxies(app);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
