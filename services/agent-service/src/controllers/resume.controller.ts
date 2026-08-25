import { Request, Response } from 'express';
import { isValidObjectId } from 'mongoose';
import { HttpError } from '../middleware/errorHandler';
import { Resume, ResumeContent } from '../models/resume.model';

function requireUid(req: Request): string {
  const uid = req.user?.uid;
  if (!uid) throw new HttpError(401, 'Unauthorized');
  return uid;
}

async function findOwnResume(req: Request) {
  const uid = requireUid(req);
  const { id } = req.params;
  if (!id || !isValidObjectId(id)) {
    throw new HttpError(400, 'Invalid resume id');
  }
  const resume = await Resume.findOne({ _id: id, userId: uid });
  if (!resume) {
    throw new HttpError(404, 'Resume not found');
  }
  return resume;
}

export async function listResumesController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const resumes = await Resume.find({ userId: uid })
    .sort({ updatedAt: -1 })
    .select('title status createdAt updatedAt');
  res.status(200).json({
    success: true,
    data: {
      items: resumes.map((r) => ({
        id: r._id.toString(),
        title: r.title,
        status: r.status,
        createdAt: r.createdAt,
        updatedAt: r.updatedAt,
      })),
    },
  });
}

export async function createResumeController(req: Request, res: Response): Promise<void> {
  const uid = requireUid(req);
  const { title, content } = (req.body ?? {}) as {
    title?: string;
    content?: Partial<ResumeContent>;
  };

  const resume = await Resume.create({
    userId: uid,
    title: title?.trim() || 'Untitled resume',
    content,
  });

  res.status(201).json({
    success: true,
    data: { id: resume._id.toString(), title: resume.title, status: resume.status },
  });
}

export async function getResumeController(req: Request, res: Response): Promise<void> {
  const resume = await findOwnResume(req);
  res.status(200).json({
    success: true,
    data: {
      id: resume._id.toString(),
      title: resume.title,
      status: resume.status,
      content: resume.content,
      createdAt: resume.createdAt,
      updatedAt: resume.updatedAt,
    },
  });
}

export async function updateResumeController(req: Request, res: Response): Promise<void> {
  const resume = await findOwnResume(req);
  const { title, status, content } = (req.body ?? {}) as {
    title?: string;
    status?: 'draft' | 'complete';
    content?: Partial<ResumeContent>;
  };

  if (title !== undefined) resume.title = title.trim() || resume.title;
  if (status !== undefined) resume.status = status;
  if (content !== undefined) resume.content = content as ResumeContent;

  await resume.save();

  res.status(200).json({
    success: true,
    data: {
      id: resume._id.toString(),
      title: resume.title,
      status: resume.status,
      content: resume.content,
      updatedAt: resume.updatedAt,
    },
  });
}

export async function deleteResumeController(req: Request, res: Response): Promise<void> {
  await findOwnResume(req);
  const { id } = req.params;
  await Resume.deleteOne({ _id: id });
  res.status(200).json({ success: true, data: { message: 'Resume deleted' } });
}
