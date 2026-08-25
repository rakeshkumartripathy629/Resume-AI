import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { listScoresController, scoreController } from '../controllers/score.controller';

const router = Router();

router.use(requireAuth);
router.post('/score', asyncHandler(scoreController));
router.get('/scores', asyncHandler(listScoresController));

export default router;
