import { Router } from 'express';
import { ReportsController } from './reports.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Todas las rutas de reportes requieren rol manager o admin
router.use(requireAuth);
router.use(requireRole('manager', 'admin'));

router.get('/daily', ReportsController.getDailyStats);
router.get('/top-items', ReportsController.getTopItems);
router.get('/purchase-projection', ReportsController.getPurchaseProjection);
router.get('/cash-shift', ReportsController.getCashShift);

export const reportsRouter = router;
