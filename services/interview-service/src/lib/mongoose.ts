import mongoose from 'mongoose';
import { env } from '../config/env';

export async function connectMongo(): Promise<void> {
  mongoose.set('strictQuery', true);
  await mongoose.connect(env.mongoUri);
  console.log(JSON.stringify({ level: 'info', service: 'interview-service', msg: 'MongoDB connected' }));
}

export async function disconnectMongo(): Promise<void> {
  await mongoose.disconnect();
}

export function isMongoReady(): boolean {
  return mongoose.connection.readyState === 1;
}
