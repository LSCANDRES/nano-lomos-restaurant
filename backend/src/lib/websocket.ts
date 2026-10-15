import { Server as HttpServer } from 'http';
import { Server as SocketIOServer, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from './logger';
import { AuthUserPayload } from '../middleware/requireAuth';

let io: SocketIOServer | null = null;

export interface AuthenticatedSocket extends Socket {
  user?: AuthUserPayload;
}

/**
 * Mapeo de roles a salas WebSocket:
 * - waiter / order_taker -> sala 'waiters'
 * - cook -> sala 'kitchen' (+ 'cook_{id}')
 * - manager -> sala 'managers'
 * - admin -> entra a todas las salas de control
 */
function getRoomsForRole(role: string, userId: number): string[] {
  const rooms: string[] = ['general'];

  if (role === 'waiter' || role === 'order_taker') {
    rooms.push('waiters');
  } else if (role === 'cook') {
    rooms.push('kitchen');
    rooms.push(`cook_${userId}`);
  } else if (role === 'manager') {
    rooms.push('managers');
  } else if (role === 'admin') {
    rooms.push('waiters', 'kitchen', 'managers');
  }

  return rooms;
}

export function initializeWebSocket(httpServer: HttpServer): SocketIOServer {
  io = new SocketIOServer(httpServer, {
    cors: {
      origin: config.CORS_ORIGIN,
      credentials: true,
      methods: ['GET', 'POST'],
    },
    pingInterval: config.WS_PING_INTERVAL,
    pingTimeout: config.WS_PING_TIMEOUT,
  });

  // Middleware de autenticación JWT para handshake WebSocket
  io.use((socket: AuthenticatedSocket, next) => {
    try {
      const token =
        socket.handshake.auth?.token ||
        socket.handshake.headers.authorization?.replace(/^Bearer\s+/i, '');

      if (!token) {
        return next(new Error('Authentication error: No se proporcionó token JWT'));
      }

      const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUserPayload;
      socket.user = decoded;
      next();
    } catch (err) {
      logger.warn({ error: err }, 'Fallo de autenticación en conexión WebSocket');
      next(new Error('Authentication error: Token inválido o expirado'));
    }
  });

  io.on('connection', (socket: AuthenticatedSocket) => {
    const user = socket.user;
    if (!user) {
      socket.disconnect();
      return;
    }

    const rooms = getRoomsForRole(user.role, user.id);
    for (const r of rooms) {
      socket.join(r);
    }

    logger.info(
      { userId: user.id, username: user.username, role: user.role, rooms },
      '🔌 Cliente WebSocket conectado a NANO LOMOS'
    );

    socket.on('disconnect', (reason) => {
      logger.info({ userId: user.id, username: user.username, reason }, 'Cliente WebSocket desconectado');
    });

    socket.on('error', (err) => {
      logger.error({ userId: user.id, err }, 'Error en socket client');
    });
  });

  logger.info('🚀 Servidor WebSocket Socket.io inicializado');
  return io;
}

export function getIO(): SocketIOServer | null {
  return io;
}

// ================= EMISIÓN DE EVENTOS DE TIEMPO REAL =================

/**
 * Notificar a Cocina y Gerente que hay un nuevo pedido creado por el mozo
 */
export function emitOrderCreated(orderData: any): void {
  if (!io) return;
  io.to('kitchen').to('managers').emit('order:created', orderData);
  logger.info({ orderId: orderData?.id }, '📢 WebSocket broadcast: order:created');
}

/**
 * Notificar cambio de estado del pedido (ej. de en preparación a listo para entregar)
 */
export function emitOrderStatusChanged(orderData: any): void {
  if (!io) return;
  // Notificar a mozos (para saber que está listo y servir), cocina y gerentes
  io.to('waiters').to('kitchen').to('managers').emit('order:status_changed', orderData);
  logger.info({ orderId: orderData?.id, status: orderData?.status }, '📢 WebSocket broadcast: order:status_changed');
}

/**
 * Notificar a gerentes si un ingrediente cae por debajo del stock mínimo
 */
export function emitLowStockAlert(ingredientData: any): void {
  if (!io) return;
  io.to('managers').emit('stock:low_alert', ingredientData);
  logger.warn({ ingredientId: ingredientData?.id, name: ingredientData?.name }, '📢 WebSocket alert: stock:low_alert');
}

/**
 * Notificar a toda la sala (waiters) cuando una mesa cambia de estado
 */
export function emitTableUpdated(tableData: any): void {
  if (!io) return;
  io.to('waiters').to('managers').emit('table:updated', tableData);
}
