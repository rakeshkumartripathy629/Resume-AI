import { Request, Response } from 'express';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';
import { Roadmap } from '../models/roadmap.model';
import { runRoadmap } from '../ai/roadmapGraph';
import { consumeCoins, refundCoins } from '../lib/coinsClient';

function requireUid(req: Request): string {
  const uid = req.user?.uid;
  if (!uid) throw new HttpError(401, 'Unauthorized');
  return uid;
}

const ROADMAP_COST = 8;

export async function generateRoadmapController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  // Validation handled by zod middleware.
  const { targetRole, experienceLevel, currentSkills } = req.body as {
    targetRole: string;
    experienceLevel: 'beginner' | 'intermediate' | 'advanced';
    currentSkills: string[];
  };

  const skills = currentSkills.map((s) => s.trim()).filter(Boolean);

  const { balance } = await consumeCoins(uid, 'roadmap_generate', { targetRole });

  let result;
  try {
    result = await runRoadmap({
      targetRole: targetRole.trim(),
      experienceLevel,
      currentSkills: skills,
    });
  } catch (err) {
    await refundCoins(uid, ROADMAP_COST, 'refund_roadmap_generate', {
      cause: 'generation_failed',
    });
    throw err;
  }

  const roadmap = await Roadmap.create({
    userId: uid,
    targetRole: targetRole.trim(),
    experienceLevel,
    currentSkills: skills,
    summary: result.gapAnalysis.notes,
    gapAnalysis: result.gapAnalysis,
    phases: result.phases,
  });

  res.status(201).json({ success: true, data: { ...roadmap.toJSON(), coinBalance: balance } });
}

export async function listMyRoadmapsController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const docs = await Roadmap.find({ userId: uid }).sort({ createdAt: -1 }).limit(20);
  res.status(200).json({
    success: true,
    data: {
      items: docs.map((doc) => ({
        id: doc._id.toString(),
        targetRole: doc.targetRole,
        experienceLevel: doc.experienceLevel,
        phaseCount: doc.phases.length,
        createdAt: doc.createdAt,
      })),
    },
  });
}

export async function getRoadmapController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const { id } = req.params;
  // `id` is already validated as a 24-char hex string by zod route param middleware.
  const roadmap = await Roadmap.findOne({ _id: id, userId: uid });
  if (!roadmap) throw new HttpError(404, 'Roadmap not found');
  res.status(200).json({ success: true, data: roadmap });
}
