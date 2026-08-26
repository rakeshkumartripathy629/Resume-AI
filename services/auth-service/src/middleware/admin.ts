import { NextFunction, Request, Response } from 'express';
import { HttpError } from './errorHandler';

export function requireAdmin(req: Request, _res: Response, next: NextFunction): void {
  if (!req.user) {
    next(new HttpError(401, 'Unauthorized'));
    return;
  }
  if (req.user.doc.role !== 'admin') {
    next(new HttpError(403, 'Admin access required'));
    return;
  }
  next();
}
