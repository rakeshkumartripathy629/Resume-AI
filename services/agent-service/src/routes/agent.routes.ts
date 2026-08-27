import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { validateBody, validateQuery } from '../middleware/validate';
import {
  scoreRequestSchema,
  tailorRequestSchema,
  generatePdfSchema,
  paginationQuerySchema,
} from '../middleware/schemas';
import { listScoresController, scoreController } from '../controllers/score.controller';
import { tailorController, listTailorsController } from '../controllers/tailor.controller';
import { generatePdfController } from '../controllers/pdf.controller';

const router = Router();

router.use(requireAuth);
router.post('/score', validateBody(scoreRequestSchema), asyncHandler(scoreController));
router.get('/scores', validateQuery(paginationQuerySchema), asyncHandler(listScoresController));
router.post('/tailor', validateBody(tailorRequestSchema), asyncHandler(tailorController));
router.get('/tailors', validateQuery(paginationQuerySchema), asyncHandler(listTailorsController));
router.post('/generate-pdf', validateBody(generatePdfSchema), asyncHandler(generatePdfController));

export default router;
