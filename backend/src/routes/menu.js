const express = require('express');
const MenuService = require('../services/menuService');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');
const upload = require('../middleware/upload');

const router = express.Router();

// GET /api/menu - Get all menu items (all authenticated users)
router.get('/', authenticateToken, async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const menuItems = await MenuService.getAllMenuItems({
      includeInactive: includeInactive === 'true' && req.user.role === 'manager',
    });
    res.json(menuItems);
  } catch (error) {
    next(error);
  }
});

// GET /api/menu/:id - Get menu item details (all authenticated users)
router.get('/:id', authenticateToken, async (req, res, next) => {
  try {
    const menuItem = await MenuService.getMenuItemById(req.params.id);
    res.json(menuItem);
  } catch (error) {
    next(error);
  }
});

// GET /api/menu/:id/recipe - Get menu item with recipe and instructions (cooks and managers)
router.get('/:id/recipe', authenticateToken, checkRole('cook', 'manager'), async (req, res, next) => {
  try {
    const menuItem = await MenuService.getMenuItemWithRecipe(req.params.id);
    res.json(menuItem);
  } catch (error) {
    next(error);
  }
});

// GET /api/menu/:id/availability - Check ingredient availability for menu item
router.get('/:id/availability', authenticateToken, async (req, res, next) => {
  try {
    const availability = await MenuService.checkMenuItemAvailability(req.params.id);
    res.json(availability);
  } catch (error) {
    next(error);
  }
});

// POST /api/menu - Create new menu item (managers only)
router.post('/', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const { name, description, price, category } = req.body;
    const menuItem = await MenuService.createMenuItem({ name, description, price, category });
    res.status(201).json(menuItem);
  } catch (error) {
    next(error);
  }
});

// PUT /api/menu/:id - Update menu item (managers only)
router.put('/:id', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const { name, description, price, category, isActive } = req.body;
    const menuItem = await MenuService.updateMenuItem(req.params.id, {
      name,
      description,
      price,
      category,
      isActive,
    });
    res.json(menuItem);
  } catch (error) {
    next(error);
  }
});

// POST /api/menu/:id/upload-image - Upload image for menu item (managers only)
router.post('/:id/upload-image', authenticateToken, checkRole('manager'), upload.single('image'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se proporcionó ningún archivo' });
    }

    // URL relativa para acceder a la imagen
    const imageUrl = `/uploads/menu-items/${req.file.filename}`;
    
    // Actualizar menu item con la nueva URL de imagen
    const menuItem = await MenuService.updateMenuItemImage(req.params.id, imageUrl);
    
    res.json({
      message: 'Imagen subida exitosamente',
      imageUrl,
      menuItem,
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
