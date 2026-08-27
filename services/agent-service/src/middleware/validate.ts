import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { HttpError } from './errorHandler';

/**
 * Express middleware that validates `req.body` against a Zod schema.
 * On failure throws HttpError(400) with a concise message.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        next(new HttpError(400, message));
      } else {
        next(err);
      }
    }
  };
}

/**
 * Express middleware that validates `req.query` against a Zod schema.
 */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.query = schema.parse(req.query) as unknown as typeof req.query;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues
          .map((i) => `${i.path.join('.')}: ${i.message}`)
          .join('; ');
        next(new HttpError(400, message));
      } else {
        next(err);
      }
    }
  };
}

/**
 * Express middleware that validates a route param against a Zod schema.
 * Stores the parsed value on `req.params[key]`.
 */
export function validateParam(key: string, schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.params[key] = schema.parse(req.params[key]) as string;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const message = err.issues.map((i) => i.message).join('; ');
        next(new HttpError(400, message));
      } else {
        next(err);
      }
    }
  };
}
