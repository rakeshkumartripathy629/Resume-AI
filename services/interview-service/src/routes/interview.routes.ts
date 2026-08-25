import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import {
  completeInterviewController,
  getInterviewController,
  listInterviewsController,
  startInterviewController,
  submitAnswerController,
} from '../controllers/interview.controller';

const router = Router();

router.use(requireAuth);
router.get('/', asyncHandler(listInterviewsController));
router.post('/start', asyncHandler(startInterviewController));
router.get('/:id', asyncHandler(getInterviewController));
router.post('/:id/answer', asyncHandler(submitAnswerController));
router.post('/:id/complete', asyncHandler(completeInterviewController));

export default router;
