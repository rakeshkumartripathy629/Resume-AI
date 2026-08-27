import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { CoinTransaction } from '../models/coin-transaction.model';
import { HttpError } from '../middleware/errorHandler';

// ── Helpers ─────────────────────────────────────────────────────────────────

function parsePage(limit: number, page: number) {
  const safeLimit = Math.min(Math.max(limit || 20, 1), 100);
  const safePage = Math.max(page || 1, 1);
  return { limit: safeLimit, page: safePage, skip: (safePage - 1) * safeLimit };
}

function getCollection(name: string) {
  const db = mongoose.connection.db;
  if (!db) throw new HttpError(500, 'Database not connected');
  return db.collection(name);
}

function toPlain(obj: unknown): unknown {
  return JSON.parse(JSON.stringify(obj));
}

// ── Dashboard Stats ─────────────────────────────────────────────────────────

export async function adminStatsController(_req: Request, res: Response): Promise<void> {
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

  const [totalUsers, newToday, newThisWeek, coinAgg] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ createdAt: { $gte: todayStart } }),
    User.countDocuments({ createdAt: { $gte: weekAgo } }),
    User.aggregate([
      { $group: { _id: null, totalCoins: { $sum: '$coins' }, avgCoins: { $avg: '$coins' } } },
    ]),
  ]);

  const paymentsCol = getCollection('payments');

  const revenueResult = await paymentsCol
    .aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amountInPaise' }, count: { $sum: 1 } } },
    ])
    .toArray();
  const revenueDoc = revenueResult[0] as { totalRevenue?: number; count?: number } | undefined;

  const scoreCount = await getCollection('scoreresults').countDocuments();
  const tailorCount = await getCollection('tailoredresumes').countDocuments();
  const interviewCount = await getCollection('interviews').countDocuments();
  const roadmapCount = await getCollection('roadmaps').countDocuments();

  const revenueByDayRaw = await paymentsCol
    .aggregate([
      { $match: { status: 'paid', paidAt: { $gte: weekAgo } } },
      {
        $group: {
          _id: { $dateToString: { format: '%Y-%m-%d', date: '$paidAt' } },
          revenue: { $sum: '$amountInPaise' },
          count: { $sum: 1 },
        },
      },
      { $sort: { _id: 1 } },
    ])
    .toArray();

  const revenueByDay = revenueByDayRaw.map((d) => ({
    date: d._id,
    revenue: d.revenue,
    count: d.count,
  }));

  res.status(200).json({
    success: true,
    data: {
      users: { total: totalUsers, newToday, newThisWeek },
      coins: {
        totalInCirculation: coinAgg[0]?.totalCoins ?? 0,
        avgPerUser: Math.round(coinAgg[0]?.avgCoins ?? 0),
      },
      revenue: {
        totalPaise: revenueDoc?.totalRevenue ?? 0,
        totalPayments: revenueDoc?.count ?? 0,
      },
      apiUsage: {
        scores: scoreCount,
        tailors: tailorCount,
        interviews: interviewCount,
        roadmaps: roadmapCount,
      },
      revenueByDay,
    },
  });
}

// ── List Users ──────────────────────────────────────────────────────────────

export async function adminListUsersController(req: Request, res: Response): Promise<void> {
  // Validated & coerced by zod adminPaginationQuerySchema.
  const { page, limit, search, sort, order } = req.query as unknown as {
    page: number; limit: number; search: string; sort: string; order: string;
  };
  const skip = (page - 1) * limit;
  const orderDir = order === 'asc' ? 1 : -1;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ [sort]: orderDir })
      .skip(skip)
      .limit(limit)
      .select('email displayName photoURL role coins createdAt lastLoginAt')
      .lean(),
    User.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: items.map((u) => ({
        id: u._id.toString(),
        email: u.email,
        displayName: u.displayName,
        photoURL: u.photoURL,
        role: u.role ?? 'user',
        coins: u.coins,
        createdAt: u.createdAt,
        lastLoginAt: u.lastLoginAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}

// ── Get User Detail ─────────────────────────────────────────────────────────

export async function adminGetUserController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await User.findById(id).select('-__v').lean();
  if (!user) throw new HttpError(404, 'User not found');

  const transactions = await CoinTransaction.find({ userId: user.firebaseUid })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean();

  res.status(200).json({
    success: true,
    data: {
      user: {
        id: user._id.toString(),
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        role: user.role ?? 'user',
        coins: user.coins,
        createdAt: user.createdAt,
        lastLoginAt: user.lastLoginAt,
      },
      recentTransactions: transactions.map((t) => ({
        action: t.action,
        amount: t.amount,
        balanceAfter: t.balanceAfter,
        createdAt: t.createdAt,
      })),
    },
  });
}

// ── Adjust Coins ────────────────────────────────────────────────────────────

export async function adminAdjustCoinsController(req: Request, res: Response): Promise<void> {
  // Validation handled by zod middleware.
  const { id } = req.params;
  const { amount, reason } = req.body as { amount: number; reason: string };

  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'User not found');

  const newBalance = user.coins + amount;
  if (newBalance < 0) throw new HttpError(400, 'Insufficient coins');
  user.coins = newBalance;
  await user.save();

  await CoinTransaction.create({
    userId: user.firebaseUid,
    action: 'admin_adjust',
    amount,
    balanceAfter: newBalance,
    meta: { reason: reason || 'Admin adjustment', adjustedBy: req.user?.uid },
  });

  res.status(200).json({
    success: true,
    data: { id: user._id.toString(), coins: user.coins },
  });
}

// ── Delete User ─────────────────────────────────────────────────────────────

export async function adminDeleteUserController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'User not found');

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw new HttpError(400, 'Cannot delete the last admin');
  }

  await CoinTransaction.deleteMany({ userId: user.firebaseUid });
  await User.findByIdAndDelete(id);

  res.status(200).json({ success: true, data: { deleted: true } });
}

// ── Toggle Role ─────────────────────────────────────────────────────────────

export async function adminToggleRoleController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const user = await User.findById(id);
  if (!user) throw new HttpError(404, 'User not found');

  if (user.role === 'admin') {
    const adminCount = await User.countDocuments({ role: 'admin' });
    if (adminCount <= 1) throw new HttpError(400, 'Cannot demote the last admin');
  }

  user.role = user.role === 'admin' ? 'user' : 'admin';
  await user.save();

  res.status(200).json({
    success: true,
    data: { id: user._id.toString(), role: user.role },
  });
}

// ── List Payments ───────────────────────────────────────────────────────────

export async function adminListPaymentsController(req: Request, res: Response): Promise<void> {
  // Validated & coerced by zod adminPaginationQuerySchema.
  const { page, limit, search, status } = req.query as unknown as {
    page: number; limit: number; search: string; status: string;
  };
  const skip = (page - 1) * limit;

  const paymentsCol = getCollection('payments');
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  if (search) {
    const matchingUsers = await User.find({
      $or: [
        { email: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
      ],
    })
      .select('firebaseUid')
      .lean();
    const uids = matchingUsers.map((u) => u.firebaseUid);
    filter.userId = { $in: uids };
  }

  const [items, total] = await Promise.all([
    paymentsCol.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    paymentsCol.countDocuments(filter),
  ]);

  const userIds = [...new Set(items.map((p: any) => p.userId))];
  const users =
    userIds.length > 0
      ? await User.find({ firebaseUid: { $in: userIds } })
          .select('firebaseUid email displayName')
          .lean()
      : [];
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((p: any) => ({
        id: p._id?.toString() ?? '',
        userEmail: userMap.get(p.userId)?.email ?? 'Unknown',
        userName: userMap.get(p.userId)?.displayName ?? '',
        planId: p.planId,
        amountInPaise: p.amountInPaise,
        coinAmount: p.coinAmount,
        status: p.status,
        createdAt: p.createdAt,
        paidAt: p.paidAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}

// ── List Scores ─────────────────────────────────────────────────────────────

export async function adminListScoresController(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parsePage(
    parseInt(String(req.query.limit), 10) || 20,
    parseInt(String(req.query.page), 10) || 1
  );

  const col = getCollection('scoreresults');
  const [items, total] = await Promise.all([
    col.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(),
  ]);

  const userIds = [...new Set(items.map((s: any) => s.userId))];
  const users =
    userIds.length > 0
      ? await User.find({ firebaseUid: { $in: userIds } })
          .select('firebaseUid email displayName')
          .lean()
      : [];
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((s: any) => ({
        id: s._id?.toString() ?? '',
        userEmail: userMap.get(s.userId)?.email ?? 'Unknown',
        userName: userMap.get(s.userId)?.displayName ?? '',
        jobTitle: s.jobTitle,
        company: s.company,
        overallScore: s.result?.overallScore ?? s.overallScore ?? 0,
        verdict: s.result?.verdict ?? s.verdict ?? 'unknown',
        createdAt: s.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}

// ── List Tailored Resumes ───────────────────────────────────────────────────

export async function adminListTailorsController(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parsePage(
    parseInt(String(req.query.limit), 10) || 20,
    parseInt(String(req.query.page), 10) || 1
  );

  const col = getCollection('tailoredresumes');
  const [items, total] = await Promise.all([
    col.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(),
  ]);

  const userIds = [...new Set(items.map((t: any) => t.userId))];
  const users =
    userIds.length > 0
      ? await User.find({ firebaseUid: { $in: userIds } })
          .select('firebaseUid email displayName')
          .lean()
      : [];
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((t: any) => ({
        id: t._id?.toString() ?? '',
        userEmail: userMap.get(t.userId)?.email ?? 'Unknown',
        userName: userMap.get(t.userId)?.displayName ?? '',
        jobTitle: t.jobTitle ?? t.payload?.jobTitle ?? '',
        company: t.company ?? t.payload?.company ?? '',
        atsScore: t.atsScore ?? t.result?.atsScore ?? 0,
        keywordCount: (t.matchedKeywords ?? t.result?.matchedKeywords ?? []).length,
        createdAt: t.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}

// ── List Interviews ─────────────────────────────────────────────────────────

export async function adminListInterviewsController(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parsePage(
    parseInt(String(req.query.limit), 10) || 20,
    parseInt(String(req.query.page), 10) || 1
  );

  const col = getCollection('interviews');
  const [items, total] = await Promise.all([
    col.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(),
  ]);

  const userIds = [...new Set(items.map((i: any) => i.userId))];
  const users =
    userIds.length > 0
      ? await User.find({ firebaseUid: { $in: userIds } })
          .select('firebaseUid email displayName')
          .lean()
      : [];
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((i: any) => ({
        id: i._id?.toString() ?? '',
        userEmail: userMap.get(i.userId)?.email ?? 'Unknown',
        userName: userMap.get(i.userId)?.displayName ?? '',
        role: i.role ?? i.jobRole ?? '',
        difficulty: i.difficulty ?? 'medium',
        status: i.status ?? 'completed',
        overallScore: i.report?.overallScore ?? i.overallScore ?? null,
        createdAt: i.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}

// ── List Roadmaps ───────────────────────────────────────────────────────────

export async function adminListRoadmapsController(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parsePage(
    parseInt(String(req.query.limit), 10) || 20,
    parseInt(String(req.query.page), 10) || 1
  );

  const col = getCollection('roadmaps');
  const [items, total] = await Promise.all([
    col.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    col.countDocuments(),
  ]);

  const userIds = [...new Set(items.map((r: any) => r.userId))];
  const users =
    userIds.length > 0
      ? await User.find({ firebaseUid: { $in: userIds } })
          .select('firebaseUid email displayName')
          .lean()
      : [];
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((r: any) => ({
        id: r._id?.toString() ?? '',
        userEmail: userMap.get(r.userId)?.email ?? 'Unknown',
        userName: userMap.get(r.userId)?.displayName ?? '',
        targetRole: r.targetRole ?? r.payload?.targetRole ?? '',
        experienceLevel: r.experienceLevel ?? r.payload?.experienceLevel ?? '',
        phaseCount: (r.phases ?? r.result?.phases ?? []).length,
        createdAt: r.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}

// ── Payment Refund ──────────────────────────────────────────────────────────

export async function adminRefundPaymentController(req: Request, res: Response): Promise<void> {
  const { id } = req.params;
  const paymentsCol = getCollection('payments');

  const payment = await paymentsCol.findOne({ _id: new mongoose.Types.ObjectId(id) });
  if (!payment) throw new HttpError(404, 'Payment not found');
  if (payment.status !== 'paid') throw new HttpError(400, 'Only paid payments can be refunded');

  await paymentsCol.updateOne(
    { _id: new mongoose.Types.ObjectId(id) },
    { $set: { status: 'refunded', refundedAt: new Date() } }
  );

  const user = await User.findOne({ firebaseUid: payment.userId });
  if (user && payment.coinAmount) {
    const newBalance = Math.max(0, user.coins - payment.coinAmount);
    user.coins = newBalance;
    await user.save();

    await CoinTransaction.create({
      userId: user.firebaseUid,
      action: 'admin_refund',
      amount: -payment.coinAmount,
      balanceAfter: newBalance,
      meta: { reason: 'Admin refund', paymentId: id, adjustedBy: req.user?.uid },
    });
  }

  res.status(200).json({ success: true, data: { refunded: true } });
}
