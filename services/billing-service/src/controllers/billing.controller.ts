import { Request, Response } from 'express';
import { env, COIN_PACKS, getPlan, isRazorpayConfigured } from '../config/env';
import { HttpError } from '../middleware/errorHandler';
import { Payment } from '../models/payment.model';
import {
  getRazorpayClient,
  isRazorpayReady,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../lib/razorpay';

function requireUid(req: Request): string {
  const uid = req.user?.uid;
  if (!uid) throw new HttpError(401, 'Unauthorized');
  return uid;
}

async function creditCoins(uid: string, amount: number, reference: string): Promise<void> {
  const response = await fetch(`${env.authServiceUrl}/internal/coins/credit`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ uid, amount, reason: 'purchase', reference }),
  });
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`Failed to credit coins: ${response.status} ${detail}`);
  }
}

export async function plansController(_req: Request, res: Response): Promise<void> {
  res.status(200).json({
    success: true,
    data: {
      configured: isRazorpayConfigured(),
      keyId: env.razorpay.keyId || null,
      packs: Object.values(COIN_PACKS),
    },
  });
}

export async function createOrderController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const { planId } = (req.body ?? {}) as { planId?: string };
  const plan = planId ? getPlan(planId) : undefined;
  if (!plan) {
    throw new HttpError(400, `Unknown planId. Available: ${Object.keys(COIN_PACKS).join(', ')}`);
  }

  const client = getRazorpayClient();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let order: any;
  try {
    order = await client.orders.create({
      amount: plan.amountInPaise,
      currency: 'INR',
      receipt: `rcpt_${plan.id}_${Date.now()}`,
      notes: { uid, planId: plan.id },
    });
  } catch (rpErr: unknown) {
    const rpError = rpErr as { statusCode?: number; error?: { description?: string }; message?: string };
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'billing-service',
        msg: 'Razorpay order creation failed',
        statusCode: rpError.statusCode,
        detail: rpError.error?.description ?? rpError.message ?? String(rpErr),
      })
    );
    const rpStatus = rpError.statusCode ?? 502;
    const rpMsg = rpError.error?.description ?? 'Payment gateway error. Please try again later.';
    throw new HttpError(rpStatus >= 400 && rpStatus < 600 ? rpStatus : 502, rpMsg);
  }

  const payment = await Payment.create({
    userId: uid,
    razorpayOrderId: order.id,
    planId: plan.id,
    amountInPaise: plan.amountInPaise,
    currency: order.currency ?? 'INR',
    coinAmount: plan.coinAmount,
  });

  res.status(201).json({
    success: true,
    data: {
      orderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: env.razorpay.keyId,
      planId: plan.id,
      coinAmount: plan.coinAmount,
      paymentDocId: (payment._id as { toString(): string }).toString(),
    },
  });
}

export async function verifyPaymentController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const {
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature,
  } = (req.body ?? {}) as {
    razorpayOrderId?: string;
    razorpayPaymentId?: string;
    razorpaySignature?: string;
  };

  if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
    throw new HttpError(400, 'razorpayOrderId, razorpayPaymentId and razorpaySignature are required');
  }

  const payment = await Payment.findOne({ razorpayOrderId, userId: uid });
  if (!payment) throw new HttpError(404, 'Order not found');

  const signatureValid = verifyPaymentSignature(
    razorpayOrderId,
    razorpayPaymentId,
    razorpaySignature
  );

  if (!signatureValid) {
    payment.status = 'failed';
    await payment.save();
    throw new HttpError(400, 'Payment signature verification failed');
  }

  if (payment.status !== 'paid') {
    payment.status = 'paid';
    payment.razorpayPaymentId = razorpayPaymentId;
    payment.razorpaySignature = razorpaySignature;
    payment.paidAt = new Date();

    // Idempotency guard: only credit coins once per order.
    if (!payment.coinsCredited) {
      await creditCoins(uid, payment.coinAmount, razorpayOrderId);
      payment.coinsCredited = true;
    }
    await payment.save();
  }

  res.status(200).json({
    success: true,
    data: {
      status: payment.status,
      coinAmount: payment.coinAmount,
      coinsCredited: payment.coinsCredited,
    },
  });
}

/** Backup path for missed verify calls — Razorpay pushes events here. */
export async function webhookController(rawBody: Buffer, req: Request, res: Response): Promise<void> {
  const signature = String(req.headers['x-razorpay-signature'] ?? '');
  if (!env.razorpay.webhookSecret) {
    res.status(503).json({ success: false, error: 'Webhook secret not configured' });
    return;
  }
  if (!verifyWebhookSignature(rawBody, signature)) {
    res.status(400).json({ success: false, error: 'Invalid signature' });
    return;
  }

  const event = req.body as {
    event?: string;
    payload?: {
      payment?: {
        entity?: { id?: string; order_id?: string };
      };
    };
  };

  if (
    event?.event === 'payment.captured' &&
    event.payload?.payment?.entity?.order_id
  ) {
    const { order_id: orderId, id: paymentEntityId } = event.payload.payment.entity;
    const payment = await Payment.findOne({ razorpayOrderId: orderId });
    if (payment && payment.status !== 'paid') {
      payment.status = 'paid';
      payment.razorpayPaymentId = paymentEntityId;
      payment.paidAt = new Date();
      if (!payment.coinsCredited) {
        try {
          await creditCoins(payment.userId, payment.coinAmount, orderId);
          payment.coinsCredited = true;
        } catch (err) {
          console.error(
            JSON.stringify({
              level: 'error',
              service: 'billing-service',
              msg: 'Webhook credit failed',
              message: err instanceof Error ? err.message : String(err),
            })
          );
        }
      }
      await payment.save();
    }
  }

  res.status(200).json({ received: true });
}

export async function historyController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const docs = await Payment.find({ userId: uid }).sort({ createdAt: -1 }).limit(20);
  res.status(200).json({
    success: true,
    data: {
      items: docs.map((doc) => ({
        id: doc._id.toString(),
        planId: doc.planId,
        coinAmount: doc.coinAmount,
        amountInPaise: doc.amountInPaise,
        status: doc.status,
        createdAt: doc.createdAt,
        paidAt: doc.paidAt ?? null,
      })),
    },
  });
}

export function configCheck(): boolean {
  return isRazorpayReady();
}
