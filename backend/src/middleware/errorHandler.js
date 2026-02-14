const logger = require('../utils/logger');

function errorHandler(err, req, res, next) {
  logger.error('Error handler caught:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    user: req.user ? req.user.username : 'anonymous',
  });

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return res.status(400).json({
      error: 'Error de validación',
      details: err.message,
    });
  }

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json({
      error: 'No autorizado',
      details: err.message,
    });
  }

  if (err.code === '23505') { // PostgreSQL unique violation
    return res.status(409).json({
      error: 'Conflicto: El recurso ya existe',
      details: err.detail,
    });
  }

  if (err.code === '23503') { // PostgreSQL foreign key violation
    return res.status(400).json({
      error: 'Error de integridad referencial',
      details: 'El recurso referenciado no existe',
    });
  }

  // Default error response
  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
}

module.exports = errorHandler;
