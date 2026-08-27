import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery, validateParam } from '../middleware/validate';
import {
  startInterviewSchema,
  submitAnswerSchema,
  objectIdParam,
  paginationQuerySchema,
} from '../middleware/schemas';
import {
  completeInterviewController,
  getInterviewController,
  listInterviewsController,
  startInterviewController,
  submitAnswerController,
} from '../controllers/interview.controller';

const router = Router();

router.use(requireAuth);
router.get('/', validateQuery(paginationQuerySchema), asyncHandler(listInterviewsController));
router.post('/start', validateBody(startInterviewSchema), asyncHandler(startInterviewController));
router.get('/:id', validateParam('id', objectIdParam), asyncHandler(getInterviewController));
router.post('/:id/answer', validateParam('id', objectIdParam), validateBody(submitAnswerSchema), asyncHandler(submitAnswerController));
router.post('/:id/complete', validateParam('id', objectIdParam), asyncHandler(completeInterviewController));

export default router;
