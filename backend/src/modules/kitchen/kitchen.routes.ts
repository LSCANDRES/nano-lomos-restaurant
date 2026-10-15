import { Router } from 'express';
import { KitchenController } from './kitchen.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Cocina requiere autenticación y rol de cook o manager
router.use(requireAuth);
router.use(requireRole('cook', 'manager'));

router.get('/queue', KitchenController.getQueue);
router.get('/my-orders', KitchenController.getMyOrders);
router.get('/ready', KitchenController.getReadyOrders);
router.get('/recipes/:menuItemId', KitchenController.getRecipe);

router.patch('/orders/:id/take', KitchenController.takeOrder);
router.patch('/orders/:id/start', KitchenController.startOrder);
router.patch('/orders/:id/complete', KitchenController.completeOrder);

export const kitchenRouter = router;
