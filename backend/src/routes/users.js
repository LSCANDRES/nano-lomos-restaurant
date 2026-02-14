const express = require('express');
const UserService = require('../services/userService');
const authenticateToken = require('../middleware/auth');
const checkRole = require('../middleware/roleCheck');

const router = express.Router();

// GET /api/users - Get all users (managers only)
router.get('/', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const { includeInactive } = req.query;
    const users = await UserService.getAllUsers({
      includeInactive: includeInactive === 'true'
    });
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/cooks - Get available cooks (for order assignment)
router.get('/cooks', authenticateToken, async (req, res, next) => {
  try {
    const cooks = await UserService.getAvailableCooks();
    res.json(cooks);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/role/:role - Get users by role (managers only)
router.get('/role/:role', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const users = await UserService.getUsersByRole(req.params.role);
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// GET /api/users/:id - Get user by ID (managers only)
router.get('/:id', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const user = await UserService.getUserById(req.params.id);
    res.json(user);
  } catch (error) {
    next(error);
  }
});

// POST /api/users - Create new user (managers only)
router.post('/', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const { username, password, fullName, role } = req.body;
    
    if (!username || !password || !fullName || !role) {
      return res.status(400).json({ 
        message: 'Todos los campos son requeridos: username, password, fullName, role' 
      });
    }
    
    const user = await UserService.createUser({ username, password, fullName, role });
    res.status(201).json(user);
  } catch (error) {
    if (error.message.includes('ya existe') || error.message.includes('inválido') || error.message.includes('caracteres')) {
      return res.status(400).json({ message: error.message });
    }
    next(error);
  }
});

// PUT /api/users/:id - Update user (managers only)
router.put('/:id', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const { fullName, role, isActive } = req.body;
    const user = await UserService.updateUser(req.params.id, { fullName, role, isActive });
    res.json(user);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
});

// PUT /api/users/:id/password - Change user password (managers only)
router.put('/:id/password', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const { password } = req.body;
    
    if (!password) {
      return res.status(400).json({ message: 'La contraseña es requerida' });
    }
    
    if (password.length < 8) {
      return res.status(400).json({ message: 'La contraseña debe tener al menos 8 caracteres' });
    }
    
    await UserService.changePassword(req.params.id, password);
    res.json({ message: 'Contraseña actualizada correctamente' });
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
});

// PUT /api/users/:id/toggle-status - Toggle user active status (managers only)
router.put('/:id/toggle-status', authenticateToken, checkRole('manager'), async (req, res, next) => {
  try {
    const user = await UserService.toggleUserStatus(req.params.id);
    res.json(user);
  } catch (error) {
    if (error.message.includes('no encontrado')) {
      return res.status(404).json({ message: error.message });
    }
    next(error);
  }
});

module.exports = router;
