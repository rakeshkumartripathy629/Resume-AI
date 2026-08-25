import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
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

router.use(requireAuth);
router.get('/', asyncHandler(listResumesController));
router.post('/', asyncHandler(createResumeController));
router.get('/:id', asyncHandler(getResumeController));
router.patch('/:id', asyncHandler(updateResumeController));
router.delete('/:id', asyncHandler(deleteResumeController));
router.get('/:id/versions', asyncHandler(listVersionsController));
router.post('/:id/versions/:version/restore', asyncHandler(restoreVersionController));

export default router;
