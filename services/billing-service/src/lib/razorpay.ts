import crypto from 'crypto';
import Razorpay from 'razorpay';
import { env } from '../config/env';

let razorpayClient: Razorpay | null = null;

export function isRazorpayReady(): boolean {
  return Boolean(env.razorpay.keyId && env.razorpay.keySecret);
}

export function getRazorpayClient(): Razorpay {
  if (!isRazorpayReady()) {
    throw Object.assign(new Error('Payments are not configured'), { statusCode: 503 });
  }
  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: env.razorpay.keyId,
      key_secret: env.razorpay.keySecret,
    });
  }
  return razorpayClient;
}

export function verifyPaymentSignature(
  orderId: string,
  paymentId: string,
  signature: string
): boolean {
  const expected = crypto
    .createHmac('sha256', env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}

export function verifyWebhookSignature(rawBody: Buffer, signature: string): boolean {
  const expected = crypto
    .createHmac('sha256', env.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
  } catch {
    return false;
  }
}
