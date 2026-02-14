const express = require('express');
const OrderService = require('../services/orderService');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/orders - Get all orders (filtered by role)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { status } = req.query;
    const options = { status };

    // Cooks only see their assigned orders
    if (req.user.role === 'cook') {
      options.assignedCookId = req.user.userId;
    }

    const orders = await OrderService.getAllOrders(options);
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/pending - Get pending orders (all authenticated users)
router.get('/pending', authenticateToken, async (req, res, next) => {
  try {
    const orders = await OrderService.getPendingOrders();
    res.json(orders);
  } catch (error) {
    next(error);
  }
});

// GET /api/orders/:id - Get specific order
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const order = await OrderService.getOrderById(req.params.id);
    
    // Cooks can only see their own assigned orders
    if (req.user.role === 'cook' && order.assigned_cook_id !== req.user.userId) {
      return res.status(403).json({ error: 'No tienes permiso para ver este pedido' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// POST /api/orders - Create new order (order_takers and managers)
router.post('/', authenticateToken, checkRole('order_taker', 'manager'), async (req, res, next) => {
  try {
    const { customerId, tableNumber, items } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'Items requeridos' });
    }

    const order = await OrderService.createOrder({
      customerId: customerId || null,
      tableNumber,
      items,
      createdBy: req.user.userId,
    });

    res.status(201).json(order);
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/status - Update order status (cooks and order_takers)
router.put('/:id/status', authenticateToken, checkRole('cook', 'order_taker', 'manager'), async (req, res, next) => {
  try {
    const { status } = req.body;

    if (!status) {
      return res.status(400).json({ error: 'Estado requerido' });
    }

    const order = await OrderService.updateOrderStatus(
      req.params.id,
      status,
      req.user.userId,
      req.user.role
    );

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// PUT /api/orders/:id/assign - Manually assign order to cook (order_takers and managers)  
// FR-006A: Manual assignment by order_taker
router.put('/:id/assign', authenticateToken, checkRole('order_taker', 'manager'), async (req, res, next) => {
  try {
    const { cookId } = req.body;

    if (!cookId) {
      return res.status(400).json({ error: 'ID de cocinero requerido' });
    }

    const order = await OrderService.assignOrderToCook(
      req.params.id,
      cookId,
      req.user.userId
    );

    res.json(order);
  } catch (error) {
    next(error);
  }
});

// POST /api/orders/auto-assign - Auto-assign next pending order (FIFO) to cook
// FR-006: FIFO automatic assignment
router.post('/auto-assign', authenticateToken, checkRole('cook'), async (req, res, next) => {
  try {
    const order = await OrderService.autoAssignNextOrder(req.user.userId);
    
    if (!order) {
      return res.status(404).json({ message: 'No hay pedidos pendientes disponibles' });
    }

    res.json(order);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
