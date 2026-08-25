import { App, cert, getApps, initializeApp } from 'firebase-admin/app';
import { Auth, DecodedIdToken, getAuth } from 'firebase-admin/auth';
import { env } from '../config/env';

let cachedAuth: Auth | null = null;

function ensureApp(): App {
  const existing = getApps()[0];
  if (existing) return existing;

  if (env.firebase.serviceAccountPath) {
    return initializeApp({
      credential: cert(env.firebase.serviceAccountPath),
    });
  }

  return initializeApp({
    credential: cert({
      projectId: env.firebase.projectId,
      clientEmail: env.firebase.clientEmail,
      privateKey: env.firebase.privateKey,
    }),
  });
}

function getAdminAuth(): Auth {
  if (!cachedAuth) {
    ensureApp();
    cachedAuth = getAuth();
  }
  return cachedAuth;
}

export function isFirebaseConfigured(): boolean {
  return Boolean(
    env.firebase.serviceAccountPath ||
      (env.firebase.projectId && env.firebase.clientEmail && env.firebase.privateKey)
  );
}

export async function verifyFirebaseIdToken(idToken: string): Promise<DecodedIdToken> {
  if (!isFirebaseConfigured()) {
    throw new Error('Firebase Admin SDK is not configured. Set FIREBASE_* env vars.');
  }
  // checkRevoked=false for latency; Redis session acts as our revocation layer.
  return getAdminAuth().verifyIdToken(idToken);
}
