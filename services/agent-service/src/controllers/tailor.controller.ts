import { Request, Response } from 'express';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';
import { runResumeTailoring } from '../ai/tailorGraph';
import { TailoredResumeModel } from '../models/tailored-resume.model';
import { consumeCoins, refundCoins } from '../lib/coinsClient';

function extractJobMeta(jobDescription: string): { jobTitle: string; company: string } {
  const firstLine = jobDescription.split('\n').find((l) => l.trim().length > 0)?.trim() ?? '';
  const atMatch = firstLine.match(/^(.+?)\s+at\s+(.+)$/i);
  if (atMatch) {
    return { jobTitle: atMatch[1].trim(), company: atMatch[2].trim() };
  }
  return { jobTitle: firstLine.slice(0, 80), company: '' };
}

export async function tailorController(req: Request, res: Response): Promise<void> {
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

  const { balance, cost } = await consumeCoins(uid, 'resume_tailor', {
    resumeChars: resumeText.length,
  });

  let result;
  try {
    result = await runResumeTailoring(resumeText.trim(), jobDescription.trim());
  } catch (err) {
    await refundCoins(uid, cost, 'refund_resume_tailor', { cause: 'tailoring_failed' });
    throw err;
  }

  const { jobTitle, company } = extractJobMeta(jobDescription);

  await TailoredResumeModel.create({
    userId: uid,
    originalResumeText: resumeText.trim().slice(0, 12000),
    jobDescription: jobDescription.trim().slice(0, 8000),
    jobTitle,
    company,
    tailoredResume: result.fullResume,
    atsScore: result.atsAnalysis.overallScore,
    atsBreakdown: result.atsAnalysis.breakdown,
    matchedKeywords: result.atsAnalysis.matchedKeywords,
    aiModel: env.openai.model,
  });

  res.status(200).json({
    success: true,
    data: {
      coinBalance: balance,
      tailoredResume: result.fullResume,
      atsAnalysis: result.atsAnalysis,
      tailoringNotes: [],
    },
  });
}

export async function listTailorsController(req: Request, res: Response): Promise<void> {
  const uid = req.user?.uid;
  if (!uid) throw new HttpError(401, 'Unauthorized');

  const page = Math.max(parseInt(String(req.query.page ?? '1'), 10) || 1, 1);
  const limit = Math.min(
    Math.max(parseInt(String(req.query.limit ?? '10'), 10) || 10, 1),
    50
  );

  const filter = { userId: uid };
  const [items, total] = await Promise.all([
    TailoredResumeModel.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .select('jobTitle company atsScore matchedKeywords createdAt')
      .lean(),
    TailoredResumeModel.countDocuments(filter),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: items.map((item) => ({
        id: String(item._id),
        jobTitle: item.jobTitle,
        company: item.company,
        atsScore: item.atsScore,
        keywordCount: item.matchedKeywords?.length ?? 0,
        createdAt: item.createdAt,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    },
  });
}
