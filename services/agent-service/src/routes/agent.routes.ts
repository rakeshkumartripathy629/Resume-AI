import { Router } from 'express';
import { asyncHandler } from '../middleware/errorHandler';
import { requireAuth } from '../middleware/auth';
import { listScoresController, scoreController } from '../controllers/score.controller';
import { tailorController, listTailorsController } from '../controllers/tailor.controller';
import { generatePdfController } from '../controllers/pdf.controller';

const router = Router();

router.use(requireAuth);
router.post('/score', asyncHandler(scoreController));
router.get('/scores', asyncHandler(listScoresController));
router.post('/tailor', asyncHandler(tailorController));
router.get('/tailors', asyncHandler(listTailorsController));
router.post('/generate-pdf', asyncHandler(generatePdfController));

export default router;
