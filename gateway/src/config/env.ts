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

export const env = {
  port: parseInt(required('PORT', '4000'), 10),
  nodeEnv: required('NODE_ENV', 'development'),
  clientOrigins: required(
    'CLIENT_ORIGIN',
    'http://localhost:5173,http://localhost:5175'
  )
    .split(',')
    .map((o) => o.trim()),
  services: {
    auth: required('AUTH_SERVICE_URL', 'http://localhost:4001'),
    agent: required('AGENT_SERVICE_URL', 'http://localhost:4002'),
    interview: required('INTERVIEW_SERVICE_URL', 'http://localhost:4003'),
    roadmap: required('ROADMAP_SERVICE_URL', 'http://localhost:4004'),
    billing: required('BILLING_SERVICE_URL', 'http://localhost:4005'),
  },
} as const;
