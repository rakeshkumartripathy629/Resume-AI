import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import {
  createResumeController,
  deleteResumeController,
  getResumeController,
  listResumesController,
  updateResumeController,
} from '../controllers/resume.controller';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listResumesController));
router.post('/', asyncHandler(createResumeController));
router.get('/:id', asyncHandler(getResumeController));
router.patch('/:id', asyncHandler(updateResumeController));
router.delete('/:id', asyncHandler(deleteResumeController));

export default router;
