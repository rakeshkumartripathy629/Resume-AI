import { NextFunction, Request, Response } from 'express';
import { verifyFirebaseIdToken } from '../lib/firebase';
import { HttpError } from './errorHandler';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { uid: string };
    }
  }
}

export async function requireAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    const header = req.headers.authorization;
    if (!header || !header.startsWith('Bearer ')) {
      throw new HttpError(401, 'Missing bearer token');
    }
    const idToken = header.slice('Bearer '.length).trim();
    const decoded = await verifyFirebaseIdToken(idToken);
    req.user = { uid: decoded.uid };
    next();
  } catch (err) {
    if (err instanceof HttpError) {
      next(err);
      return;
    }
    const message = err instanceof Error ? err.message : 'Invalid or expired token';
    next(new HttpError(401, message));
  }
}
