import { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

export function blockInternalPaths(req: Request, _res: Response, next: NextFunction): void {
  if (req.path.startsWith('/internal')) {
    next(new HttpError(403, 'Forbidden'));
    return;
  }
  next();
}

function proxyTo(target: string) {
  return createProxyMiddleware({
    target,
    changeOrigin: false,
    xfwd: true,
    timeout: 180_000,
    proxyTimeout: 180_000,
    on: {
      proxyReq: fixRequestBody,
      error: (err, req, res) => {
        const message = `Upstream unavailable: ${req.url ?? ''}`;
        console.error(
          JSON.stringify({
            level: 'error',
            service: 'gateway',
            target,
            message: err.message,
          })
        );
        const serverRes = res as unknown as import('http').ServerResponse;
        if (typeof serverRes.writeHead === 'function' && !serverRes.headersSent) {
          serverRes.writeHead(502, { 'Content-Type': 'application/json' });
          serverRes.end(JSON.stringify({ success: false, error: message }));
        }
      },
    },
  });
}

const routeTable: Array<[string, string]> = [
  ['/api/v1/auth', env.services.auth],
  ['/api/v1/coins', env.services.auth],
  ['/api/v1/agent', env.services.agent],
  ['/api/v1/resumes', env.services.agent],
  ['/api/v1/interviews', env.services.interview],
  ['/api/v1/roadmaps', env.services.roadmap],
  ['/api/v1/billing', env.services.billing],
];

export function mountProxies(app: import('express').Express): void {
  for (const [prefix, target] of routeTable) {
    app.use(prefix, proxyTo(target));
  }
}
