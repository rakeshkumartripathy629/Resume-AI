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
    version: 1,
    versions: [],
  });

  res.status(201).json({
    success: true,
    data: { id: resume._id.toString(), title: resume.title, status: resume.status, version: 1 },
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
      version: resume.version,
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

  if (content !== undefined) {
    // Auto-snapshot current content before overwriting (keep last 20 versions)
    if (resume.content && (resume.content.personalInfo.fullName || resume.content.skills.length > 0)) {
      const snapshot = {
        version: resume.version,
        content: resume.content as unknown as ResumeContent,
        title: resume.title,
        savedAt: new Date(),
      };
      resume.versions.push(snapshot);
      if (resume.versions.length > 20) {
        resume.versions = resume.versions.slice(-20);
      }
    }
    resume.content = content as ResumeContent;
    resume.version += 1;
  }

  if (title !== undefined) resume.title = title.trim() || resume.title;
  if (status !== undefined) resume.status = status;

  await resume.save();

  res.status(200).json({
    success: true,
    data: {
      id: resume._id.toString(),
      title: resume.title,
      status: resume.status,
      content: resume.content,
      version: resume.version,
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

export async function restoreVersionController(req: Request, res: Response): Promise<void> {
  const resume = await findOwnResume(req);
  const versionNum = parseInt(req.params.version, 10);
  if (isNaN(versionNum) || versionNum < 1) {
    throw new HttpError(400, 'Invalid version number');
  }

  const snapshot = resume.versions.find((v) => v.version === versionNum);
  if (!snapshot) {
    throw new HttpError(404, `Version ${versionNum} not found`);
  }

  // Snapshot current state before restoring
  const currentSnapshot = {
    version: resume.version,
    content: resume.content as unknown as ResumeContent,
    title: resume.title,
    savedAt: new Date(),
  };
  resume.versions.push(currentSnapshot);
  if (resume.versions.length > 20) {
    resume.versions = resume.versions.slice(-20);
  }

  resume.content = snapshot.content;
  resume.version += 1;
  await resume.save();

  res.status(200).json({
    success: true,
    data: {
      id: resume._id.toString(),
      title: resume.title,
      content: resume.content,
      version: resume.version,
    },
  });
}

export async function listVersionsController(req: Request, res: Response): Promise<void> {
  const resume = await findOwnResume(req);
  res.status(200).json({
    success: true,
    data: {
      currentVersion: resume.version,
      versions: resume.versions.map((v) => ({
        version: v.version,
        title: v.title,
        savedAt: v.savedAt,
      })),
    },
  });
}
