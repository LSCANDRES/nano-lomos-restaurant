import { Router } from 'express';
import { TablesController } from './tables.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Todas las rutas requieren estar autenticado (mozo, cocinero o gerente)
router.use(requireAuth);

router.get('/', TablesController.getTables);
router.get('/:id', TablesController.getTableById);

// Solo gerentes y administradores pueden modificar la configuración de mesas
router.post('/', requireRole('manager'), TablesController.createTable);
router.put('/:id', requireRole('manager'), TablesController.updateTable);
router.delete('/:id', requireRole('manager'), TablesController.deleteTable);

export const tablesRouter = router;
