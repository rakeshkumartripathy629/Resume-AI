import { Router } from 'express';
import { z } from 'zod';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParam } from '../middleware/validate';
import { createResumeSchema, updateResumeSchema } from '../middleware/schemas';
import {
  createResumeController,
  deleteResumeController,
  getResumeController,
  listResumesController,
  listVersionsController,
  restoreVersionController,
  updateResumeController,
} from '../controllers/resume.controller';

const router = Router();

const objectIdParam = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId');
const versionParam = z.string().regex(/^\d+$/, 'Version must be a positive integer');

router.use(requireAuth);
router.get('/', asyncHandler(listResumesController));
router.post('/', validateBody(createResumeSchema), asyncHandler(createResumeController));
router.get('/:id', validateParam('id', objectIdParam), asyncHandler(getResumeController));
router.patch('/:id', validateParam('id', objectIdParam), validateBody(updateResumeSchema), asyncHandler(updateResumeController));
router.delete('/:id', validateParam('id', objectIdParam), asyncHandler(deleteResumeController));
router.get('/:id/versions', validateParam('id', objectIdParam), asyncHandler(listVersionsController));
router.post('/:id/versions/:version/restore', validateParam('id', objectIdParam), validateParam('version', versionParam), asyncHandler(restoreVersionController));

export default router;
