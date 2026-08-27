import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { validateQuery } from '../middleware/validate';
import { paginationQuerySchema } from '../middleware/schemas';
import { balanceController, transactionsController } from '../controllers/coins.controller';

const router = Router();

router.use(requireAuth);
router.get('/balance', asyncHandler(balanceController));
router.get('/transactions', validateQuery(paginationQuerySchema), asyncHandler(transactionsController));

export default router;
