import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Todas las rutas de inventario requieren autenticación
router.use(requireAuth);

// Listar ingredientes accesible para manager y admin (o mozo/cocina si se requiere consulta)
router.get('/', InventoryController.getAllIngredients);

// Restock y transacciones reservadas a manager y admin
router.post('/restock', requireRole('manager', 'admin'), InventoryController.restockIngredient);
router.get('/transactions', requireRole('manager', 'admin'), InventoryController.getTransactions);

export const inventoryRouter = router;
