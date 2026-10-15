import { Router } from 'express';
import { MenuController } from './menu.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Todas las consultas requieren autenticación de staff
router.use(requireAuth);

router.get('/', MenuController.getMenu);
router.get('/:id', MenuController.getMenuItem);
router.get('/:id/availability', MenuController.getMenuItemAvailability);

// Solo el gerente o admin modifica los platos y precios
router.post('/', requireRole('manager'), MenuController.createMenuItem);
router.put('/:id', requireRole('manager'), MenuController.updateMenuItem);
router.delete('/:id', requireRole('manager'), MenuController.deleteMenuItem);

export const menuRouter = router;
