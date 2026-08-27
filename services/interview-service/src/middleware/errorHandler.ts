import { NextFunction, Request, Response } from 'express';
import { env } from '../config/env';

export class HttpError extends Error {
  constructor(
    public readonly statusCode: number,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function notFoundHandler(req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: `Route not found: ${req.method} ${req.originalUrl}`,
  });
}

export function errorHandler(err: Error, req: Request, res: Response, _next: NextFunction): void {
  const statusCode = err instanceof HttpError ? err.statusCode : 500;

  if (statusCode >= 500) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'interview-service',
        requestId: req.requestId,
        method: req.method,
        url: req.originalUrl,
        message: err.message,
        stack: err.stack,
      })
    );
  }

  const exposeMessage = statusCode < 500 || env.nodeEnv !== 'production';

  res.status(statusCode).json({
    success: false,
    error: exposeMessage ? err.message : 'Internal server error',
  });
}

export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>
): (req: Request, res: Response, next: NextFunction) => void {
  return (req, res, next) => {
    fn(req, res, next).catch(next);
  };
}
