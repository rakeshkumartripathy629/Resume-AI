import { redis } from '../lib/redis';
import { env } from '../config/env';

export interface SessionData {
  uid: string;
  createdAt: number;
}

const sessionKey = (uid: string) => `session:${uid}`;

export async function createSession(uid: string): Promise<void> {
  const data: SessionData = { uid, createdAt: Date.now() };
  await redis.set(sessionKey(uid), JSON.stringify(data), 'EX', env.sessionTtlSeconds);
}

export async function getSession(uid: string): Promise<SessionData | null> {
  const raw = await redis.get(sessionKey(uid));
  if (!raw) return null;
  try {
    return JSON.parse(raw) as SessionData;
  } catch {
    return null;
  }
}

export async function deleteSession(uid: string): Promise<void> {
  await redis.del(sessionKey(uid));
}
