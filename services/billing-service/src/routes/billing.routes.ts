import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody } from '../middleware/validate';
import { createOrderSchema, verifyPaymentSchema } from '../middleware/schemas';
import {
  createOrderController,
  historyController,
  plansController,
  verifyPaymentController,
} from '../controllers/billing.controller';

const router = Router();

router.get('/plans', requireAuth, asyncHandler(plansController));
router.post('/orders', requireAuth, validateBody(createOrderSchema), asyncHandler(createOrderController));
router.post('/verify', requireAuth, validateBody(verifyPaymentSchema), asyncHandler(verifyPaymentController));
router.get('/history', requireAuth, asyncHandler(historyController));

export default router;
