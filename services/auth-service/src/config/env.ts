import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

function required(key: string, fallback?: string): string {
  const value = process.env[key] ?? fallback;
  if (!value) {
    throw new Error(`Missing required env var: ${key}`);
  }
  return value;
}

const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY ?? '';

export const env = {
  port: parseInt(required('PORT', '4001'), 10),
  nodeEnv: required('NODE_ENV', 'development'),
  clientOrigins: required('CLIENT_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),
  mongoUri: required('MONGODB_URI', 'mongodb://localhost:27017/resume-builder'),
  redisUrl: required('REDIS_URL', 'redis://localhost:6379'),
  sessionTtlSeconds: parseInt(required('SESSION_TTL_SECONDS', '604800'), 10),
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : '',
  },
} as const;
