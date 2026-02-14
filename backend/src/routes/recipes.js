const express = require('express');
const RecipeService = require('../services/recipeService');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/recipes/:menuItemId - Get recipe with instructions for a menu item
router.get('/:menuItemId', authenticateToken, checkRole('cook', 'manager'), async (req, res, next) => {
  try {
    const recipe = await RecipeService.getRecipeWithInstructions(req.params.menuItemId);
    res.json(recipe);
  } catch (error) {
    next(error);
  }
});

// PUT /api/recipes/:menuItemId/instructions - Update recipe instructions (managers only)
router.put('/:menuItemId/instructions', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const { instructions } = req.body;
    
    if (!instructions) {
      return res.status(400).json({ error: 'Las instrucciones son requeridas' });
    }
    
    const recipes = await RecipeService.updateInstructions(req.params.menuItemId, instructions);
    res.json({
      message: 'Instrucciones actualizadas exitosamente',
      recipes,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
