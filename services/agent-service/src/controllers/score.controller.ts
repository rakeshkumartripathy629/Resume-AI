import { Request, Response } from 'express';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';
import { runResumeScoring } from '../ai/graph';
import { ScoreResultModel } from '../models/score-result.model';
import { consumeCoins, refundCoins } from '../lib/coinsClient';

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

  // Validation already handled by zod middleware in route.
  const { resumeText, jobDescription } = req.body as {
    resumeText: string;
    jobDescription: string;
  };

  // Charge coins before doing expensive LLM work; refund if it fails.
  const { balance, cost } = await consumeCoins(uid, 'resume_score', {
    resumeChars: resumeText.length,
  });

  let result;
  try {
    result = await runResumeScoring(resumeText.trim(), jobDescription.trim());
  } catch (err) {
    console.error(
      JSON.stringify({
        level: 'error',
        service: 'agent-service',
        msg: 'Scoring failed',
        uid,
        message: err instanceof Error ? err.message : String(err),
      })
    );
    await refundCoins(uid, cost, 'refund_resume_score', { cause: 'scoring_failed' });
    throw err;
  }

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
      coinBalance: balance,
      ...result,
    },
  });
}

export async function listScoresController(req: Request, res: Response): Promise<void> {
  const uid = req.user?.uid;
  if (!uid) throw new HttpError(401, 'Unauthorized');

  // Validated & coerced by zod paginationQuerySchema.
  const { page, limit } = req.query as unknown as { page: number; limit: number };

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
