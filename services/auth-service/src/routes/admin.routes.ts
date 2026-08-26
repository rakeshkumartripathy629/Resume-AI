import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../middleware/errorHandler';
import {
  adminStatsController,
  adminListUsersController,
  adminGetUserController,
  adminAdjustCoinsController,
  adminDeleteUserController,
  adminToggleRoleController,
  adminListPaymentsController,
  adminRefundPaymentController,
  adminListScoresController,
  adminListTailorsController,
  adminListInterviewsController,
  adminListRoadmapsController,
} from '../controllers/admin.controller';

const router = Router();

router.use(requireAuth, requireAdmin);

router.get('/stats', asyncHandler(adminStatsController));
router.get('/users', asyncHandler(adminListUsersController));
router.get('/users/:id', asyncHandler(adminGetUserController));
router.post('/users/:id/coins', asyncHandler(adminAdjustCoinsController));
router.post('/users/:id/toggle-role', asyncHandler(adminToggleRoleController));
router.delete('/users/:id', asyncHandler(adminDeleteUserController));
router.get('/payments', asyncHandler(adminListPaymentsController));
router.post('/payments/:id/refund', asyncHandler(adminRefundPaymentController));
router.get('/scores', asyncHandler(adminListScoresController));
router.get('/tailors', asyncHandler(adminListTailorsController));
router.get('/interviews', asyncHandler(adminListInterviewsController));
router.get('/roadmaps', asyncHandler(adminListRoadmapsController));

export default router;
