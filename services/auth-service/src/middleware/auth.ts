import { NextFunction, Request, Response } from 'express';
import { verifyFirebaseIdToken } from '../lib/firebase';
import { HttpError } from './errorHandler';
import { getSession } from '../services/session.service';
import { User, IUser } from '../models/user.model';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: { uid: string; doc: IUser };
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

    const session = await getSession(decoded.uid);
    if (!session) {
      throw new HttpError(401, 'Session expired or revoked. Please sign in again.');
    }

    const user = await User.findOne({ firebaseUid: decoded.uid });
    if (!user) {
      throw new HttpError(401, 'User not found. Please sign in again.');
    }

    req.user = { uid: decoded.uid, doc: user };
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
