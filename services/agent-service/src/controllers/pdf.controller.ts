import { Request, Response } from 'express';
import { HttpError } from '../middleware/errorHandler';
import { generateResumePdfBuffer } from '../lib/pdfGenerator';
import type { ResumeExportData } from '../lib/pdfGenerator';

export async function generatePdfController(req: Request, res: Response): Promise<void> {
  const { resume } = (req.body ?? {}) as { resume?: ResumeExportData };

  if (!resume) {
    throw new HttpError(400, 'resume object is required');
  }

  const buffer = await generateResumePdfBuffer(resume);

  const safeName = (resume.contact?.fullName || 'Resume').replace(/[^a-zA-Z0-9\s_-]/g, '').replace(/\s+/g, '_');

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="${safeName}_Resume.pdf"`);
  res.setHeader('Content-Length', buffer.length);
  res.status(200).end(buffer);
}
