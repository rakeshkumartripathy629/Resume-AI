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
  port: parseInt(required('PORT', '4005'), 10),
  nodeEnv: required('NODE_ENV', 'development'),
  clientOrigins: required('CLIENT_ORIGIN', 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim()),
  mongoUri: required('MONGODB_URI', 'mongodb://localhost:27017/resume-builder'),
  authServiceUrl: required('AUTH_SERVICE_URL', 'http://localhost:4001'),
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
  },
  firebase: {
    serviceAccountPath: process.env.FIREBASE_SERVICE_ACCOUNT_PATH || '',
    projectId: process.env.FIREBASE_PROJECT_ID || '',
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL || '',
    privateKey: rawPrivateKey ? rawPrivateKey.replace(/\\n/g, '\n') : '',
  },
} as const;

export interface CoinPackPlan {
  id: string;
  name: string;
  description: string;
  amountInPaise: number;
  coinAmount: number;
  popular?: boolean;
}

export const COIN_PACKS: Record<string, CoinPackPlan> = {
  starter: {
    id: 'starter',
    name: 'Starter Pack',
    description: '150 coins — perfect for trying things out',
    amountInPaise: 9900,
    coinAmount: 150,
  },
  pro: {
    id: 'pro',
    name: 'Pro Pack',
    description: '500 coins — for serious job hunting',
    amountInPaise: 29900,
    coinAmount: 500,
    popular: true,
  },
};

export function getPlan(planId: string): CoinPackPlan | undefined {
  return COIN_PACKS[planId];
}

export function isRazorpayConfigured(): boolean {
  return Boolean(env.razorpay.keyId && env.razorpay.keySecret);
}
