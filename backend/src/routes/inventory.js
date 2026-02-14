const express = require('express');
const router = express.Router();
const inventoryService = require('../services/inventoryService');
const authMiddleware = require('../middleware/auth');

// All inventory routes require authentication
router.use(authMiddleware);

// Middleware to check manager role
const requireManager = (req, res, next) => {
  if (req.user.role !== 'manager') {
    return res.status(403).json({ 
      message: 'Acceso denegado. Solo los gerentes pueden gestionar inventario.' 
    });
  }
  next();
};

/**
 * GET /api/inventory
 * Get all ingredients with stock status
 */
router.get('/', requireManager, async (req, res, next) => {
  try {
    const ingredients = await inventoryService.getIngredients();
    res.json(ingredients);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inventory/summary
 * Get inventory summary statistics
 */
router.get('/summary', requireManager, async (req, res, next) => {
  try {
    const summary = await inventoryService.getInventorySummary();
    res.json(summary);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inventory/low-stock
 * Get ingredients with low stock
 */
router.get('/low-stock', requireManager, async (req, res, next) => {
  try {
    const ingredients = await inventoryService.getLowStockIngredients();
    res.json(ingredients);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inventory/purchase-list
 * Generate purchase list for low stock items
 */
router.get('/purchase-list', requireManager, async (req, res, next) => {
  try {
    const purchaseList = await inventoryService.generatePurchaseList();
    res.json(purchaseList);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/inventory/:id
 * Get a single ingredient by ID
 */
router.get('/:id', requireManager, async (req, res, next) => {
  try {
    const ingredient = await inventoryService.getIngredientById(parseInt(req.params.id));
    res.json(ingredient);
  } catch (error) {
    if (error.message === 'Ingrediente no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
});

/**
 * GET /api/inventory/:id/history
 * Get stock transaction history for an ingredient
 */
router.get('/:id/history', requireManager, async (req, res, next) => {
  try {
    const { limit } = req.query;
    const history = await inventoryService.getStockHistory(
      parseInt(req.params.id), 
      parseInt(limit) || 20
    );
    res.json(history);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/inventory
 * Create a new ingredient
 */
router.post('/', requireManager, async (req, res, next) => {
  try {
    const ingredient = await inventoryService.createIngredient(req.body);
    res.status(201).json(ingredient);
  } catch (error) {
    if (error.message.includes('requeridos') || error.code === '23505') {
      return res.status(400).json({ 
        message: error.code === '23505' ? 'Ya existe un ingrediente con ese nombre' : error.message 
      });
    }
    next(error);
  }
});

/**
 * PUT /api/inventory/:id
 * Update an ingredient
 */
router.put('/:id', requireManager, async (req, res, next) => {
  try {
    const ingredient = await inventoryService.updateIngredient(
      parseInt(req.params.id), 
      req.body
    );
    res.json(ingredient);
  } catch (error) {
    if (error.message === 'Ingrediente no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
});

/**
 * POST /api/inventory/:id/restock
 * Add stock to an ingredient
 */
router.post('/:id/restock', requireManager, async (req, res, next) => {
  try {
    const { quantity, notes } = req.body;
    
    if (!quantity || quantity <= 0) {
      return res.status(400).json({ message: 'La cantidad debe ser mayor a 0' });
    }

    const ingredient = await inventoryService.restockIngredient(
      parseInt(req.params.id),
      parseFloat(quantity),
      req.user.id,
      notes || ''
    );
    
    res.json({ 
      message: `Stock actualizado correctamente. Nuevo stock: ${ingredient.current_stock} ${ingredient.unit}`,
      ingredient 
    });
  } catch (error) {
    if (error.message === 'Ingrediente no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
});

/**
 * DELETE /api/inventory/:id
 * Delete an ingredient (if not used in recipes)
 */
router.delete('/:id', requireManager, async (req, res, next) => {
  try {
    await inventoryService.deleteIngredient(parseInt(req.params.id));
    res.json({ message: 'Ingrediente eliminado correctamente' });
  } catch (error) {
    if (error.message.includes('usado en recetas')) {
      return res.status(400).json({ message: error.message });
    }
    if (error.message === 'Ingrediente no encontrado') {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
});

module.exports = router;
