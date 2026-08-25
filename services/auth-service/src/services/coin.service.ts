import { User } from '../models/user.model';
import { CoinTransaction } from '../models/coin-transaction.model';
import { HttpError } from '../middleware/errorHandler';
import { COIN_COSTS, STARTING_COINS, type CoinAction } from '../config/costs';

/** Lazily backfill coins for users created before the ledger existed. */
async function ensureCoinsField(uid: string): Promise<void> {
  await User.updateOne(
    { firebaseUid: uid, coins: { $exists: false } },
    { $set: { coins: STARTING_COINS } }
  );
}

export async function getBalance(uid: string): Promise<number> {
  await ensureCoinsField(uid);
  const user = await User.findOne({ firebaseUid: uid }).select('coins').lean();
  if (!user) {
    throw new HttpError(404, 'User not found');
  }
  return user.coins ?? 0;
}

export interface ConsumeResult {
  balance: number;
  cost: number;
  transactionId: string;
}

export async function consumeCoins(params: {
  uid: string;
  action: CoinAction;
  meta?: Record<string, unknown>;
}): Promise<ConsumeResult> {
  const { uid, action, meta } = params;
  const cost = COIN_COSTS[action];

  await ensureCoinsField(uid);

  // Atomic guard: only debits when balance covers the cost.
  const updated = await User.findOneAndUpdate(
    { firebaseUid: uid, coins: { $gte: cost } },
    { $inc: { coins: -cost } },
    { new: true }
  ).select('coins');

  if (!updated) {
    const user = await User.findOne({ firebaseUid: uid }).select('coins').lean();
    throw new HttpError(
      402,
      user
        ? `Insufficient coins: need ${cost}, have ${user.coins ?? 0}.`
        : 'User not found'
    );
  }

  const tx = await CoinTransaction.create({
    userId: uid,
    action,
    amount: -cost,
    balanceAfter: updated.coins,
    meta: meta ?? {},
  });

  return { balance: updated.coins, cost, transactionId: tx._id.toString() };
}

export async function creditCoins(params: {
  uid: string;
  amount: number;
  reason: string;
  meta?: Record<string, unknown>;
}): Promise<ConsumeResult> {
  const { uid, amount, reason, meta } = params;

  if (!Number.isInteger(amount) || amount <= 0 || amount > 100_000) {
    throw new HttpError(400, 'Invalid credit amount');
  }

  await ensureCoinsField(uid);

  const updated = await User.findOneAndUpdate(
    { firebaseUid: uid },
    { $inc: { coins: amount } },
    { new: true }
  ).select('coins');

  if (!updated) {
    throw new HttpError(404, 'User not found');
  }

  const tx = await CoinTransaction.create({
    userId: uid,
    action: reason,
    amount,
    balanceAfter: updated.coins,
    meta: meta ?? {},
  });

  return { balance: updated.coins, cost: amount, transactionId: tx._id.toString() };
}

export async function listTransactions(uid: string, page: number, limit: number) {
  const filter = { userId: uid };
  const [items, total] = await Promise.all([
    CoinTransaction.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    CoinTransaction.countDocuments(filter),
  ]);

  return {
    items: items.map((tx) => ({
      id: tx._id.toString(),
      action: tx.action,
      amount: tx.amount,
      balanceAfter: tx.balanceAfter,
      createdAt: tx.createdAt,
    })),
    pagination: { page, limit, total, pages: Math.ceil(total / limit) },
  };
}
