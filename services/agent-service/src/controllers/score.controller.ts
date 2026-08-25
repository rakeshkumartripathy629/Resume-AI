import { Request, Response } from 'express';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';
import { runResumeScoring } from '../ai/graph';
import { ScoreResultModel } from '../models/score-result.model';

function extractJobMeta(jobDescription: string): { jobTitle: string; company: string } {
  const firstLine = jobDescription.split('\n').find((l) => l.trim().length > 0)?.trim() ?? '';
  const atMatch = firstLine.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    return { jobTitle: atMatch[1].trim(), company: atMatch[2].trim() };
  }
  return { jobTitle: firstLine.slice(0, 80), company: '' };
}

export async function scoreController(req: Request, res: Response): Promise<void> {
  const uid = req.user?.uid;
  if (!uid) throw new HttpError(401, 'Unauthorized');

  const { resumeText, jobDescription } = (req.body ?? {}) as {
    resumeText?: string;
    jobDescription?: string;
  };

  if (!resumeText || resumeText.trim().length < 80) {
    throw new HttpError(400, 'resumeText is required (min 80 characters)');
  }
  if (!jobDescription || jobDescription.trim().length < 40) {
    throw new HttpError(400, 'jobDescription is required (min 40 characters)');
  }

  const result = await runResumeScoring(resumeText.trim(), jobDescription.trim());

  const { jobTitle, company } = extractJobMeta(jobDescription);

  const doc = await ScoreResultModel.create({
    userId: uid,
    jobTitle,
    company,
    resumeExcerpt: resumeText.trim().slice(0, 400),
    result,
    model: env.openai.model,
  });

  res.status(200).json({
    success: true,
    data: {
      scoreId: doc._id.toString(),
      createdAt: doc.createdAt,
      ...result,
    },
  });
}

export async function listScoresController(req: Request, res: Response): Promise<void> {
  const uid = req.user?.uid;
  if (!uid) throw new HttpError(401, 'Unauthorized');

  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? '10'), 10) || 10, 1),
    50
  );

  const filter = { userId: uid };
  const [items, total] = await Promise.all([
    ScoreResultModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('jobTitle company overallScore verdict createdAt')
      .lean(),
    ScoreResultModel.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: items.map((item) => ({
        id: String(item._id),
        jobTitle: item.jobTitle,
        company: item.company,
        overallScore: item.result?.overallScore ?? 0,
        verdict: item.result?.verdict ?? 'needs_work',
        createdAt: item.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}
