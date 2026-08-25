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
  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(String(req.query.limit ?? '15'), 10) || 15, 1), 50);
  const data = await listTransactions(uid, page, limit);
  res.status(200).json({ success: true, data });
}

export async function internalConsumeController(req: Request, res: Response): Promise<void> {
  const { uid, action, meta } = (req.body ?? {}) as {
    uid?: string;
    action?: string;
    meta?: Record<string, unknown>;
  };
  if (!uid || !isCoinAction(action)) {
    throw new HttpError(
      400,
      `uid and valid action are required (one of: ${Object.keys(COIN_COSTS).join(', ')})`
    );
  }
  const result = await consumeCoins({ uid, action, meta });
  res.status(200).json({ success: true, data: result });
}

export async function internalCreditController(req: Request, res: Response): Promise<void> {
  const { uid, amount, reason, meta } = (req.body ?? {}) as {
    uid?: string;
    amount?: number;
    reason?: string;
    meta?: Record<string, unknown>;
  };
  if (!uid || typeof amount !== 'number' || !reason) {
    throw new HttpError(400, 'uid, amount and reason are required');
  }
  const result = await creditCoins({ uid, amount, reason, meta });
  res.status(200).json({ success: true, data: result });
}
