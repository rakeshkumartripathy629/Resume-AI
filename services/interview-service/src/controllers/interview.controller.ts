import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { env } from '../config/env';
import { HttpError } from '../middleware/errorHandler';
import { Interview } from '../models/interview.model';
import { runAnswerEvaluation, runInterviewReport, runQuestionPlan } from '../ai/interviewGraphs';
import { consumeCoins, refundCoins } from '../lib/coinsClient';

function requireUid(req: Request): string {
  const uid = req.user?.uid;
  if (!uid) throw new HttpError(401, 'Unauthorized');
  return uid;
}

async function findOwnInterview(req: Request) {
  const uid = requireUid(req);
  const { id } = req.params;
  if (!id || !isValidObjectId(id)) {
    throw new HttpError(400, 'Invalid interview id');
  }
  const interview = await Interview.findOne({ _id: id, userId: uid });
  if (!interview) {
    throw new HttpError(404, 'Interview not found');
  }
  return interview;
}

function publicView(doc: Awaited<ReturnType<typeof findOwnInterview>>) {
  return {
    id: doc._id.toString(),
    role: doc.role,
    difficulty: doc.difficulty,
    status: doc.status,
    questionCount: doc.questions.length,
    currentQuestionIndex: doc.currentQuestionIndex,
    questions: doc.questions.map((q) => ({ text: q.text, type: q.type })),
    answers: doc.answers,
    evaluations: doc.evaluations,
    report: doc.report,
    createdAt: doc.createdAt,
    completedAt: doc.completedAt,
  };
}

export async function startInterviewController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const { role, difficulty = 'medium', jdText = '' } = (req.body ?? {}) as {
    role?: string;
    difficulty?: 'easy' | 'medium' | 'hard';
    jdText?: string;
  };

  if (!role || role.trim().length < 2) {
    throw new HttpError(400, 'role is required');
  }

  // Charge coins up-front; refund if question generation fails.
  const { balance } = await consumeCoins(uid, 'interview_start', { role });

  let plan;
  try {
    plan = await runQuestionPlan({
      role: role.trim(),
      difficulty,
      jdText: jdText.trim(),
      questionCount: env.defaultQuestionCount,
    });
  } catch (err) {
    await refundCoins(uid, 10, 'refund_interview_start', { cause: 'plan_failed', role });
    throw err;
  }

  const interview = await Interview.create({
    userId: uid,
    role: role.trim(),
    difficulty,
    jdText: jdText.trim().slice(0, 8000),
    questions: plan.questions,
    evaluations: plan.questions.map(() => null),
  });

  res.status(201).json({
    success: true,
    data: { ...publicView(interview), coinBalance: balance },
  });
}

export async function listInterviewsController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const page = Math.max(1, parseInt(String(req.query.page ?? '1'), 10) || 1);
  const limit = Math.min(20, Math.max(1, parseInt(String(req.query.limit ?? '10'), 10) || 10));

  const [docs, total] = await Promise.all([
    Interview.find({ userId: uid })
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit),
    Interview.countDocuments({ userId: uid }),
  ]);

  res.status(200).json({
    success: true,
    data: {
      items: docs.map((doc) => ({
        id: doc._id.toString(),
        role: doc.role,
        difficulty: doc.difficulty,
        status: doc.status,
        questionCount: doc.questions.length,
        answeredCount: doc.answers.length,
        overallScore: doc.report?.overallScore ?? null,
        createdAt: doc.createdAt,
        completedAt: doc.completedAt ?? null,
      })),
      total,
      page,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function getInterviewController(req: Request, res: Response): Promise<void> {
  const interview = await findOwnInterview(req);
  res.status(200).json({ success: true, data: publicView(interview) });
}

export async function submitAnswerController(req: Request, res: Response): Promise<void> {
  const interview = await findOwnInterview(req);

  if (interview.status === 'completed') {
    throw new HttpError(409, 'Interview already completed');
  }

  const { questionIndex, answer } = (req.body ?? {}) as {
    questionIndex?: number;
    answer?: string;
  };

  if (
    typeof questionIndex !== 'number' ||
    questionIndex < 0 ||
    questionIndex >= interview.questions.length
  ) {
    throw new HttpError(400, `questionIndex must be 0-${interview.questions.length - 1}`);
  }
  if (!answer || answer.trim().length < 10) {
    throw new HttpError(400, 'answer is required (min 10 characters)');
  }

  const question = interview.questions[questionIndex];

  const evaluation = await runAnswerEvaluation({
    role: interview.role,
    difficulty: interview.difficulty,
    jdText: interview.jdText,
    question: question.text,
    questionType: question.type,
    answer: answer.trim(),
  });

  // Idempotent overwrite for the same question index.
  interview.answers = interview.answers.filter((a) => a.questionIndex !== questionIndex);
  interview.answers.push({ questionIndex, text: answer.trim(), submittedAt: new Date() });
  interview.evaluations[questionIndex] = evaluation;
  interview.currentQuestionIndex = Math.min(questionIndex + 1, interview.questions.length - 1);

  await interview.save();

  res.status(200).json({
    success: true,
    data: {
      evaluation,
      nextQuestionIndex:
        questionIndex + 1 < interview.questions.length ? questionIndex + 1 : null,
      allAnswered: interview.answers.length === interview.questions.length,
    },
  });
}

export async function completeInterviewController(req: Request, res: Response): Promise<void> {
  const interview = await findOwnInterview(req);

  if (interview.status === 'completed') {
    res.status(200).json({ success: true, data: publicView(interview) });
    return;
  }

  if (interview.answers.length === 0) {
    throw new HttpError(409, 'Cannot complete an interview with zero answers');
  }

  const report = await runInterviewReport({
    role: interview.role,
    difficulty: interview.difficulty,
    questions: interview.questions.map((q) => ({ text: q.text, type: q.type })),
    answers: interview.answers.map((a) => ({
      questionIndex: a.questionIndex,
      text: a.text.slice(0, 3000),
    })),
    evaluations: interview.evaluations
      .map((e, i) =>
        e ? { questionIndex: i, score: e.score, feedbackHint: e.modelAnswerHint } : null
      )
      .filter((e): e is NonNullable<typeof e> => e !== null),
  });

  interview.report = report;
  interview.status = 'completed';
  interview.completedAt = new Date();
  await interview.save();

  res.status(200).json({ success: true, data: publicView(interview) });
}
