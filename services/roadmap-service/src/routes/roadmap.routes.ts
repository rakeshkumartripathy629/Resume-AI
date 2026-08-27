import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateParam } from '../middleware/validate';
import { generateRoadmapSchema, objectIdParam } from '../middleware/schemas';
import {
  generateRoadmapController,
  getRoadmapController,
  listMyRoadmapsController,
} from '../controllers/roadmap.controller';

const router = Router();

router.use(requireAuth);
router.post('/generate', validateBody(generateRoadmapSchema), asyncHandler(generateRoadmapController));
router.get('/mine', asyncHandler(listMyRoadmapsController));
router.get('/:id', validateParam('id', objectIdParam), asyncHandler(getRoadmapController));

export default router;
