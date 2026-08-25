import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { balanceController, transactionsController } from '../controllers/coins.controller';

const router = Router();

router.use(requireAuth);
router.get('/balance', asyncHandler(balanceController));
router.get('/transactions', asyncHandler(transactionsController));

export default router;
