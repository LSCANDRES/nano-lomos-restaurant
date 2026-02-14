const express = require('express');
const KitchenService = require('../services/kitchenService');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/kitchen/assigned - Get currently assigned order for logged-in cook
router.get('/assigned', authenticateToken, checkRole('cook'), async (req, res, next) => {
  try {
    const cookId = req.user.id;
    const order = await KitchenService.getAssignedOrder(cookId);
    
    if (!order) {
      return res.json({
        message: 'No tienes pedidos asignados actualmente',
        order: null,
      });
    }
    
    res.json(order);
  } catch (error) {
    next(error);
  }
});

// POST /api/kitchen/request-order - Request next order (auto-assign oldest pending)
router.post('/request-order', authenticateToken, checkRole('cook'), async (req, res, next) => {
  try {
    const cookId = req.user.id;
    const order = await KitchenService.assignOrderToCook(cookId);
    
    if (!order) {
      return res.json({
        message: 'No hay pedidos pendientes en este momento',
        order: null,
      });
    }
    
    res.json({
      message: 'Pedido asignado exitosamente',
      order,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/kitchen/stats - Get cook statistics for today
router.get('/stats', authenticateToken, checkRole('cook'), async (req, res, next) => {
  try {
    const cookId = req.user.id;
    const { date } = req.query;
    
    const stats = await KitchenService.getCookStats(cookId, date);
    res.json(stats);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
