import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      requestId?: string;
    }
  }
}

export function requestContext(req: Request, res: Response, next: NextFunction): void {
  req.requestId = (req.headers['x-request-id'] as string) || randomUUID();
  res.setHeader('x-request-id', req.requestId);

  const startedAt = Date.now();
  res.on('finish', () => {
    const durationMs = Date.now() - startedAt;
    const log = {
      level: 'info',
      service: 'roadmap-service',
      requestId: req.requestId,
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      durationMs,
    };
    if (res.statusCode >= 500) {
      console.error(JSON.stringify({ ...log, level: 'error' }));
    } else {
      console.log(JSON.stringify(log));
    }
  });

  next();
}
