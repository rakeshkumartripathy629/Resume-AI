import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import {
  createOrderController,
  historyController,
  plansController,
  verifyPaymentController,
} from '../controllers/billing.controller';

const router = Router();

router.get('/plans', requireAuth, asyncHandler(plansController));
router.post('/orders', requireAuth, asyncHandler(createOrderController));
router.post('/verify', requireAuth, asyncHandler(verifyPaymentController));
router.get('/history', requireAuth, asyncHandler(historyController));

export default router;
