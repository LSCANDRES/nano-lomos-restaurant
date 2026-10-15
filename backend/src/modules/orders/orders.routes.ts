import { Router } from 'express';
import { OrdersController } from './orders.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Todas las rutas de pedidos requieren autenticación
router.use(requireAuth);

router.get('/', OrdersController.getOrders);
router.get('/cooks', requireRole('order_taker', 'waiter', 'cook', 'manager', 'admin'), OrdersController.getAvailableCooks);
router.get('/:id', OrdersController.getOrderById);

// Mostrador, mozo o gerente crean pedidos
router.post('/', requireRole('order_taker', 'waiter', 'manager', 'admin'), OrdersController.createOrder);

// Asignar pedido a un cocinero específico desde Mostrador o Gerente
router.patch('/:id/assign-cook', requireRole('order_taker', 'manager', 'admin'), OrdersController.assignCook);

// Entregar pedidos (mostrador o mozo)
router.patch('/:id/deliver', requireRole('order_taker', 'waiter', 'manager', 'admin'), OrdersController.deliverOrder);

// Cobrar pedidos (descuenta stock)
router.patch('/:id/pay', requireRole('order_taker', 'waiter', 'manager', 'admin'), OrdersController.payOrder);

// Cancelar comanda
router.patch('/:id/cancel', OrdersController.cancelOrder);

export const ordersRouter = router;
