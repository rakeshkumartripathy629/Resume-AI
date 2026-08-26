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

  // Revenue from payments collection (direct Mongo access since we share the DB)
  const payments = User.db.db!.collection('payments');
  const revenue = await payments
    .aggregate([
      { $match: { status: 'paid' } },
      { $group: { _id: null, totalRevenue: { $sum: '$amountInPaise' }, count: { $sum: 1 } } },
    ])
    .toArray();

  // API usage counts
  const scores = User.db.db!.collection('scoreresults');
  const tailors = User.db.db!.collection('tailoredresumes');
  const interviews = User.db.db!.collection('interviews');
  const roadmaps = User.db.db!.collection('roadmaps');

  const [scoreCount, tailorCount, interviewCount, roadmapCount] = await Promise.all([
    scores.countDocuments(),
    tailors.countDocuments(),
    interviews.countDocuments(),
    roadmaps.countDocuments(),
  ]);

  // Revenue by day (last 7 days)
  const revenueByDay = await payments
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

  res.status(200).json({
    success: true,
    data: {
      users: { total: totalUsers, newToday, newThisWeek },
      coins: { totalInCirculation: coinAgg[0]?.totalCoins ?? 0, avgPerUser: Math.round(coinAgg[0]?.avgCoins ?? 0) },
      revenue: { totalPaise: revenue[0]?.totalRevenue ?? 0, totalPayments: revenue[0]?.count ?? 0 },
      apiUsage: { scores, tailors, interviews, roadmaps },
      revenueByDay: revenueByDay.map((d: any) => ({ date: d._id, revenue: d.revenue, count: d.count })),
    },
  });
}

// ── List Users ──────────────────────────────────────────────────────────────

export async function adminListUsersController(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parsePage(
    parseInt(String(req.query.limit), 10) || 20,
    parseInt(String(req.query.page), 10) || 1
  );
  const search = String(req.query.search || '').trim();
  const sort = String(req.query.sort || 'createdAt') as string;
  const order = req.query.order === 'asc' ? 1 : -1;

  const filter: Record<string, unknown> = {};
  if (search) {
    filter.$or = [
      { email: { $regex: search, $options: 'i' } },
      { displayName: { $regex: search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .sort({ [sort]: order })
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
        role: u.role,
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
        role: user.role,
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
  const { id } = req.params;
  const { amount, reason } = req.body as { amount?: number; reason?: string };

  if (!amount || typeof amount !== 'number' || amount === 0) {
    throw new HttpError(400, 'amount is required and must be a non-zero number');
  }

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

// ── List Payments ───────────────────────────────────────────────────────────

export async function adminListPaymentsController(req: Request, res: Response): Promise<void> {
  const { page, limit, skip } = parsePage(
    parseInt(String(req.query.limit), 10) || 20,
    parseInt(String(req.query.page), 10) || 1
  );
  const status = String(req.query.status || '').trim();
  const search = String(req.query.search || '').trim();

  const payments = User.db.db!.collection('payments');
  const filter: Record<string, unknown> = {};
  if (status) filter.status = status;

  if (search) {
    const matchingUsers = await User.find({
      $or: [{ email: { $regex: search, $options: 'i' } }, { displayName: { $regex: search, $options: 'i' } }],
    }).select('firebaseUid').lean();
    const uids = matchingUsers.map((u) => u.firebaseUid);
    filter.userId = { $in: uids };
  }

  const [items, total] = await Promise.all([
    payments.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    payments.countDocuments(filter),
  ]);

  // Resolve user emails
  const userIds = [...new Set(items.map((p: any) => p.userId))];
  const users = await User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid email displayName').lean();
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((p: any) => ({
        id: p._id.toString(),
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

  const collection = User.db.db!.collection('scoreresults');
  const [items, total] = await Promise.all([
    collection.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(),
  ]);

  const userIds = [...new Set(items.map((s: any) => s.userId))];
  const users = await User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid email displayName').lean();
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((s: any) => ({
        id: s._id.toString(),
        userEmail: userMap.get(s.userId)?.email ?? 'Unknown',
        userName: userMap.get(s.userId)?.displayName ?? '',
        jobTitle: s.jobTitle,
        company: s.company,
        overallScore: s.result?.overallScore ?? 0,
        verdict: s.result?.verdict ?? 'unknown',
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

  const collection = User.db.db!.collection('tailoredresumes');
  const [items, total] = await Promise.all([
    collection.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(),
  ]);

  const userIds = [...new Set(items.map((t: any) => t.userId))];
  const users = await User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid email displayName').lean();
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((t: any) => ({
        id: t._id.toString(),
        userEmail: userMap.get(t.userId)?.email ?? 'Unknown',
        userName: userMap.get(t.userId)?.displayName ?? '',
        jobTitle: t.jobTitle,
        company: t.company,
        atsScore: t.atsScore ?? 0,
        keywordCount: (t.matchedKeywords ?? []).length,
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

  const collection = User.db.db!.collection('interviews');
  const [items, total] = await Promise.all([
    collection.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(),
  ]);

  const userIds = [...new Set(items.map((i: any) => i.userId))];
  const users = await User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid email displayName').lean();
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((i: any) => ({
        id: i._id.toString(),
        userEmail: userMap.get(i.userId)?.email ?? 'Unknown',
        userName: userMap.get(i.userId)?.displayName ?? '',
        role: i.role,
        difficulty: i.difficulty,
        status: i.status,
        overallScore: i.report?.overallScore ?? null,
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

  const collection = User.db.db!.collection('roadmaps');
  const [items, total] = await Promise.all([
    collection.find().sort({ createdAt: -1 }).skip(skip).limit(limit).toArray(),
    collection.countDocuments(),
  ]);

  const userIds = [...new Set(items.map((r: any) => r.userId))];
  const users = await User.find({ firebaseUid: { $in: userIds } }).select('firebaseUid email displayName').lean();
  const userMap = new Map(users.map((u) => [u.firebaseUid, u]));

  res.status(200).json({
    success: true,
    data: {
      items: items.map((r: any) => ({
        id: r._id.toString(),
        userEmail: userMap.get(r.userId)?.email ?? 'Unknown',
        userName: userMap.get(r.userId)?.displayName ?? '',
        targetRole: r.targetRole,
        experienceLevel: r.experienceLevel,
        phaseCount: (r.phases ?? []).length,
        createdAt: r.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}
