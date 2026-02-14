const express = require('express');
const AuthService = require('../services/authService');
const User = require('../models/User');
const authenticateToken = require('../middleware/auth');

const router = express.Router();

// POST /api/auth/login
router.post('/login', async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({ error: 'Usuario y contraseña son requeridos' });
    }

    const result = await AuthService.login(username, password);

    if (!result.success) {
      return res.status(401).json({ error: result.message });
    }

    res.json({
      token: result.token,
      user: result.user,
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/auth/me - Get current user info
router.get('/me', authenticateToken, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.userId);
    
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' });
    }

    res.json(user);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
