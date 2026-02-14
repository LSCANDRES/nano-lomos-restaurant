const logger = require('../utils/logger');

function checkRole(...allowedRoles) {
  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'No autenticado' });
      }

      if (!allowedRoles.includes(req.user.role)) {
        logger.warn(`Unauthorized access attempt by user ${req.user.username} (${req.user.role}) to ${req.path}`);
        return res.status(403).json({ 
          error: 'No tienes permisos para realizar esta acción',
          requiredRole: allowedRoles,
          userRole: req.user.role
        });
      }

      next();
    } catch (error) {
      logger.error('Role check middleware error', { error: error.message });
      res.status(500).json({ error: 'Error de autorización' });
    }
  };
}

module.exports = checkRole;
