import { Request, Response } from 'express';
import { HttpError } from '../middleware/errorHandler';
import { isCoinAction, COIN_COSTS } from '../config/costs';
import {
  consumeCoins,
  creditCoins,
  getBalance,
  listTransactions,
} from '../services/coin.service';

function requireUid(req: Request): string {
  const uid = req.user?.uid;
  if (!uid) throw new HttpError(401, 'Unauthorized');
  return uid;
}

export async function balanceController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const balance = await getBalance(uid);
  res.status(200).json({ success: true, data: { balance } });
}

export async function transactionsController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  // Validated & coerced by zod paginationQuerySchema.
  const { page, limit } = req.query as unknown as { page: number; limit: number };
  const data = await listTransactions(uid, page, limit);
  res.status(200).json({ success: true, data });
}

export async function internalConsumeController(req: Request, res: Response): Promise<void> {
  // Validation handled by zod middleware.
  const { uid, action, meta } = req.body as {
    uid: string;
    action: string;
    meta?: Record<string, unknown>;
  };
  if (!isCoinAction(action)) {
    throw new HttpError(
      400,
      `Invalid action (one of: ${Object.keys(COIN_COSTS).join(', ')})`
    );
  }
  const result = await consumeCoins({ uid, action, meta });
  res.status(200).json({ success: true, data: result });
}

export async function internalCreditController(req: Request, res: Response): Promise<void> {
  // Validation handled by zod middleware.
  const { uid, amount, reason, meta } = req.body as {
    uid: string;
    amount: number;
    reason: string;
    meta?: Record<string, unknown>;
  };
  const result = await creditCoins({ uid, amount, reason, meta });
  res.status(200).json({ success: true, data: result });
}
