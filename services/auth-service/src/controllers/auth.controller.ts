import { Request, Response } from 'express';
import { User, IUser } from '../models/user.model';
import { createSession, deleteSession } from '../services/session.service';
import { HttpError } from '../middleware/errorHandler';
import { verifyFirebaseIdToken } from '../lib/firebase';

function publicUser(doc: IUser) {
  return {
    id: doc._id.toString(),
    firebaseUid: doc.firebaseUid,
    email: doc.email,
    displayName: doc.displayName,
    photoURL: doc.photoURL,
    provider: doc.provider,
    role: doc.role,
    createdAt: doc.createdAt,
  };
}

export async function createSessionController(req: Request, res: Response): Promise<void> {
  // Validation handled by zod middleware.
  const { idToken } = req.body as { idToken: string };

  let decoded;
  try {
    decoded = await verifyFirebaseIdToken(idToken);
  } catch {
    throw new HttpError(401, 'Invalid or expired idToken');
  }
  if (!decoded.uid || !decoded.email) {
    throw new HttpError(401, 'Invalid token payload');
  }

  const user = await User.findOneAndUpdate(
    { firebaseUid: decoded.uid },
    {
      $set: {
        email: decoded.email.toLowerCase(),
        displayName: decoded.name ?? '',
        photoURL: decoded.picture ?? '',
        provider: decoded.firebase?.sign_in_provider ?? 'firebase',
      },
      $setOnInsert: { firebaseUid: decoded.uid },
      $currentDate: { lastLoginAt: true },
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await createSession(decoded.uid);

  res.status(200).json({
    success: true,
    data: { user: publicUser(user) },
  });
}

export async function meController(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Unauthorized');
  }
  res.status(200).json({
    success: true,
    data: { user: publicUser(req.user.doc) },
  });
}

export async function logoutController(req: Request, res: Response): Promise<void> {
  if (!req.user) {
    throw new HttpError(401, 'Unauthorized');
  }
  await deleteSession(req.user.uid);
  res.status(200).json({
    success: true,
    data: { message: 'Logged out successfully' },
  });
}
