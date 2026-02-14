const AuthService = require('../services/authService');
const logger = require('../utils/logger');

async function authenticateToken(req, res, next) {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({ error: 'Token no proporcionado' });
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return res.status(403).json({ error: 'Token inválido o expirado' });
    }

    req.user = decoded;
    next();
  } catch (error) {
    logger.error('Authentication middleware error', { error: error.message });
    res.status(500).json({ error: 'Error de autenticación' });
  }
}

module.exports = authenticateToken;
