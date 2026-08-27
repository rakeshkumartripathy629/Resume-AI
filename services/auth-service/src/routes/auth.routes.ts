import { Router } from 'express';
import { createSessionController, logoutController, meController } from '../controllers/auth.controller';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createSessionSchema } from '../middleware/schemas';

const router = Router();

router.post('/session', validateBody(createSessionSchema), asyncHandler(createSessionController));
router.get('/me', requireAuth, asyncHandler(meController));
router.post('/logout', requireAuth, asyncHandler(logoutController));

export default router;
