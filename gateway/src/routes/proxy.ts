import { NextFunction, Request, Response } from 'express';
import { createProxyMiddleware, fixRequestBody } from 'http-proxy-middleware';
import http from 'http';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';

export function blockInternalPaths(req: Request, _res: Response, next: NextFunction): void {
  if (req.path.startsWith('/internal')) {
    next(new HttpError(403, 'Forbidden'));
    return;
  }
  next();
}

// ── Circuit Breaker ─────────────────────────────────────────────────────────

interface CircuitState {
  failures: number;
  lastFailure: number;
  open: boolean;
  openedAt: number;
}

const circuits = new Map<string, CircuitState>();
const FAILURE_THRESHOLD = 3;
const FAILURE_WINDOW_MS = 60_000;
const OPEN_DURATION_MS = 30_000;

function recordFailure(target: string): void {
  const now = Date.now();
  let s = circuits.get(target);
  if (!s) {
    s = { failures: 0, lastFailure: 0, open: false, openedAt: 0 };
    circuits.set(target, s);
  }
  if (now - s.lastFailure > FAILURE_WINDOW_MS) s.failures = 0;
  s.failures++;
  s.lastFailure = now;

  if (s.failures >= FAILURE_THRESHOLD && !s.open) {
    s.open = true;
    s.openedAt = now;
    console.warn(JSON.stringify({ level: 'warn', service: 'gateway', msg: `Circuit OPEN for ${target}`, failures: s.failures }));
  }
}

function recordSuccess(target: string): void {
  const s = circuits.get(target);
  if (s) {
    s.failures = 0;
    if (s.open) {
      s.open = false;
      console.info(JSON.stringify({ level: 'info', service: 'gateway', msg: `Circuit CLOSED for ${target}` }));
    }
  }
}

function isCircuitOpen(target: string): boolean {
  const s = circuits.get(target);
  if (!s || !s.open) return false;
  if (Date.now() - s.openedAt > OPEN_DURATION_MS) { s.open = false; s.failures = 0; return false; }
  return true;
}

// ── Quick Health Check ──────────────────────────────────────────────────────

function quickHealthCheck(target: string): Promise<boolean> {
  return new Promise((resolve) => {
    const url = new URL(target);
    const req = http.get(`${url.protocol}//${url.hostname}:${url.port}/health`, { timeout: 2000 }, (res) => {
      res.on('data', () => {});
      res.on('end', () => resolve(res.statusCode === 200));
    });
    req.on('error', () => resolve(false));
    req.on('timeout', () => { req.destroy(); resolve(false); });
  });
}

// ── Proxy with Retry ────────────────────────────────────────────────────────

function proxyToWithRetry(prefix: string, target: string) {
  return createProxyMiddleware({
    pathFilter: prefix,
    target,
    changeOrigin: false,
    xfwd: true,
    timeout: 180_000,
    proxyTimeout: 180_000,
    on: {
      proxyReq: fixRequestBody,
      error: (err, req, res) => {
        const serverRes = res as unknown as import('http').ServerResponse;
        if (serverRes.headersSent) return;

        recordFailure(target);

        if (isCircuitOpen(target)) {
          serverRes.writeHead(503, { 'Content-Type': 'application/json', 'Retry-After': '30' });
          serverRes.end(JSON.stringify({ success: false, error: `Service temporarily unavailable (circuit open): ${req.url ?? ''}`, retryAfter: 30 }));
          return;
        }

        console.warn(JSON.stringify({ level: 'warn', service: 'gateway', msg: `Proxy error for ${req.url}, retrying in 2s...`, target, error: err.message }));

        setTimeout(() => {
          quickHealthCheck(target).then((healthy) => {
            if (healthy) {
              recordSuccess(target);
              const retryReq = http.request(`${target}${(req as any).originalUrl || (req as any).url}`, { method: req.method, headers: { ...req.headers, host: new URL(target).host }, timeout: 60_000 }, (upstreamRes) => {
                if (serverRes.headersSent) return;
                serverRes.writeHead(upstreamRes.statusCode || 502, upstreamRes.headers);
                upstreamRes.pipe(serverRes);
              });
              retryReq.on('error', () => {
                if (!serverRes.headersSent) { serverRes.writeHead(502, { 'Content-Type': 'application/json' }); serverRes.end(JSON.stringify({ success: false, error: 'Upstream still unavailable after retry' })); }
              });
              retryReq.end();
            } else {
              if (!serverRes.headersSent) {
                serverRes.writeHead(502, { 'Content-Type': 'application/json' });
                serverRes.end(JSON.stringify({ success: false, error: `Upstream unavailable: ${req.url ?? ''}` }));
              }
            }
          });
        }, 2000);
      },
    },
  });
}

// ── Route Table ─────────────────────────────────────────────────────────────

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
    app.use(proxyToWithRetry(prefix, target));
  }
}
