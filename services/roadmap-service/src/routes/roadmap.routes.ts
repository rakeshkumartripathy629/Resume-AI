import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import {
  generateRoadmapController,
  getRoadmapController,
  listMyRoadmapsController,
} from '../controllers/roadmap.controller';

const router = Router();

router.use(requireAuth);
router.post('/generate', asyncHandler(generateRoadmapController));
router.get('/mine', asyncHandler(listMyRoadmapsController));
router.get('/:id', asyncHandler(getRoadmapController));

export default router;
