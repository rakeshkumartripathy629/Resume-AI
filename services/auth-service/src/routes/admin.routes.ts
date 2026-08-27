import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireAdmin } from '../middleware/admin';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBody, validateQuery, validateParam } from '../middleware/validate';
import {
  adminPaginationQuerySchema,
  objectIdParam,
  adjustCoinsSchema,
} from '../middleware/schemas';
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
router.get('/users', validateQuery(adminPaginationQuerySchema), asyncHandler(adminListUsersController));
router.get('/users/:id', validateParam('id', objectIdParam), asyncHandler(adminGetUserController));
router.post('/users/:id/coins', validateParam('id', objectIdParam), validateBody(adjustCoinsSchema), asyncHandler(adminAdjustCoinsController));
router.post('/users/:id/toggle-role', validateParam('id', objectIdParam), asyncHandler(adminToggleRoleController));
router.delete('/users/:id', validateParam('id', objectIdParam), asyncHandler(adminDeleteUserController));
router.get('/payments', validateQuery(adminPaginationQuerySchema), asyncHandler(adminListPaymentsController));
router.post('/payments/:id/refund', validateParam('id', objectIdParam), asyncHandler(adminRefundPaymentController));
router.get('/scores', validateQuery(adminPaginationQuerySchema), asyncHandler(adminListScoresController));
router.get('/tailors', validateQuery(adminPaginationQuerySchema), asyncHandler(adminListTailorsController));
router.get('/interviews', validateQuery(adminPaginationQuerySchema), asyncHandler(adminListInterviewsController));
router.get('/roadmaps', validateQuery(adminPaginationQuerySchema), asyncHandler(adminListRoadmapsController));

export default router;
