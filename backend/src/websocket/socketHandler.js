const socketIo = require('socket.io');
const AuthService = require('../services/authService');
const logger = require('../utils/logger');

let io;

function initializeSocket(server) {
  io = socketIo(server, {
    cors: {
      origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingInterval: parseInt(process.env.WS_PING_INTERVAL || '25000'),
    pingTimeout: parseInt(process.env.WS_PING_TIMEOUT || '5000'),
  });

  // Authentication middleware for WebSocket
  io.use((socket, next) => {
    const token = socket.handshake.auth.token || socket.handshake.headers.authorization?.split(' ')[1];

    if (!token) {
      return next(new Error('Authentication error: No token provided'));
    }

    const decoded = AuthService.verifyToken(token);
    if (!decoded) {
      return next(new Error('Authentication error: Invalid token'));
    }

    socket.user = decoded;
    next();
  });

  io.on('connection', (socket) => {
    logger.info(`WebSocket client connected: ${socket.user.username} (${socket.user.role})`);

    // Join room based on role
    const room = getRoomForRole(socket.user.role);
    socket.join(room);
    logger.info(`User ${socket.user.username} joined room: ${room}`);

    // Join personal room (for cook-specific assignments)
    if (socket.user.role === 'cook') {
      socket.join(`cook_${socket.user.userId}`);
    }

    socket.on('disconnect', () => {
      logger.info(`WebSocket client disconnected: ${socket.user.username}`);
    });

    // Handle errors
    socket.on('error', (error) => {
      logger.error('WebSocket error', { 
        user: socket.user.username, 
        error: error.message 
      });
    });
  });

  logger.info('WebSocket server initialized');
  return io;
}

function getRoomForRole(role) {
  const rooms = {
    manager: 'managers',
    cook: 'kitchen',
    order_taker: 'order_takers',
  };
  return rooms[role] || 'general';
}

function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
}

// Broadcast functions
function broadcastToManagers(event, data) {
  getIO().to('managers').emit(event, data);
  logger.debug(`Broadcast to managers: ${event}`);
}

function broadcastToKitchen(event, data) {
  getIO().to('kitchen').emit(event, data);
  logger.debug(`Broadcast to kitchen: ${event}`);
}

function broadcastToOrderTakers(event, data) {
  getIO().to('order_takers').emit(event, data);
  logger.debug(`Broadcast to order_takers: ${event}`);
}

function broadcastToAll(event, data) {
  getIO().emit(event, data);
  logger.debug(`Broadcast to all: ${event}`);
}

function sendToCook(cookId, event, data) {
  getIO().to(`cook_${cookId}`).emit(event, data);
  logger.debug(`Send to cook ${cookId}: ${event}`);
}

module.exports = {
  initializeSocket,
  getIO,
  broadcastToManagers,
  broadcastToKitchen,
  broadcastToOrderTakers,
  broadcastToAll,
  sendToCook,
};
