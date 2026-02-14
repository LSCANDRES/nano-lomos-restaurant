const Order = require('../models/Order');
const db = require('../database/connection');
const logger = require('../utils/logger');
const { broadcastToKitchen, broadcastToManagers } = require('../websocket/socketHandler');

class KitchenService {
  /**
   * Asignar automáticamente el pedido más antiguo pendiente a un cocinero
   */
  static async assignOrderToCook(cookId) {
    try {
      // Buscar el pedido pendiente más antiguo (FIFO)
      const query = `
        SELECT id FROM orders
        WHERE status = 'pending'
        AND assigned_cook_id IS NULL
        ORDER BY created_at ASC
        LIMIT 1
      `;
      
      const result = await db.query(query);
      
      if (result.rows.length === 0) {
        return null; // No hay pedidos pendientes
      }

      const orderId = result.rows[0].id;
      
      // Asignar el pedido al cocinero
      const updateQuery = `
        UPDATE orders
        SET 
          assigned_cook_id = $1,
          status = 'assigned',
          updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING *
      `;
      
      const updateResult = await db.query(updateQuery, [cookId, orderId]);
      const order = updateResult.rows[0];
      
      // Emitir evento WebSocket
      broadcastToKitchen('order:assigned', {
        orderId: order.id,
        cookId,
        tableNumber: order.table_number,
      });
      
      broadcastToManagers('order:assigned', {
        orderId: order.id,
        cookId,
      });
      
      logger.info(`Order ${orderId} assigned to cook ${cookId}`);
      return order;
    } catch (error) {
      logger.error('Error assigning order to cook', { cookId, error: error.message });
      throw error;
    }
  }

  /**
   * Obtener el pedido actualmente asignado a un cocinero
   */
  static async getAssignedOrder(cookId) {
    try {
      const query = `
        SELECT 
          o.*,
          json_agg(
            json_build_object(
              'id', ol.id,
              'menu_item_id', ol.menu_item_id,
              'name', mi.name,
              'quantity', ol.quantity,
              'unit_price', ol.unit_price,
              'notes', ol.notes
            )
          ) as items
        FROM orders o
        LEFT JOIN order_lines ol ON o.id = ol.order_id
        LEFT JOIN menu_items mi ON ol.menu_item_id = mi.id
        WHERE o.assigned_cook_id = $1
        AND o.status IN ('assigned', 'in_progress')
        GROUP BY o.id
        ORDER BY o.created_at ASC
        LIMIT 1
      `;
      
      const result = await db.query(query, [cookId]);
      return result.rows[0] || null;
    } catch (error) {
      logger.error('Error fetching assigned order', { cookId, error: error.message });
      throw error;
    }
  }

  /**
   * Actualizar el estado de un pedido (validando transiciones válidas)
   */
  static async updateOrderStatus(orderId, cookId, newStatus) {
    try {
      // Obtener el pedido actual
      const order = await Order.findById(orderId);
      
      if (!order) {
        throw new Error('Pedido no encontrado');
      }

      // Verificar que el pedido está asignado a este cocinero
      if (order.assigned_cook_id !== cookId) {
        throw new Error('Este pedido no está asignado a ti');
      }

      // Validar transiciones de estado
      const validTransitions = {
        assigned: ['in_progress'],
        in_progress: ['completed'],
      };

      if (!validTransitions[order.status]?.includes(newStatus)) {
        throw new Error(`Transición de estado inválida: ${order.status} → ${newStatus}`);
      }

      // Actualizar el estado
      const updatedOrder = await Order.updateStatus(orderId, newStatus);
      
      // Emitir evento WebSocket
      emitToRoom('order-takers', 'order:updated', {
        orderId,
        status: newStatus,
        cookId,
      });
      
      emitToRoom('managers', 'order:updated', {
        orderId,
        status: newStatus,
      });

      if (newStatus === 'completed') {
        emitToRoom('kitchen', 'order:completed', {
          orderId,
          cookId,
        });
        
        // Auto-asignar siguiente pedido
        const nextOrder = await this.assignOrderToCook(cookId);
        
        if (nextOrder) {
          logger.info(`Next order ${nextOrder.id} auto-assigned to cook ${cookId}`);
        }
      }

      logger.info(`Order ${orderId} status updated to ${newStatus}`, { cookId });
      return updatedOrder;
    } catch (error) {
      logger.error('Error updating order status', { orderId, cookId, newStatus, error: error.message });
      throw error;
    }
  }

  /**
   * Obtener estadísticas del cocinero
   */
  static async getCookStats(cookId, date = null) {
    try {
      const dateFilter = date
        ? `AND DATE(o.completed_at) = $2`
        : `AND DATE(o.completed_at) = CURRENT_DATE`;
      
      const params = date ? [cookId, date] : [cookId];

      const query = `
        SELECT 
          COUNT(*) as completed_count,
          AVG(EXTRACT(EPOCH FROM (o.completed_at - o.created_at))/60) as avg_time_minutes,
          SUM(o.total_amount) as total_revenue
        FROM orders o
        WHERE o.assigned_cook_id = $1
        AND o.status = 'completed'
        ${dateFilter}
      `;
      
      const result = await db.query(query, params);
      const stats = result.rows[0];
      
      return {
        completed_count: parseInt(stats.completed_count) || 0,
        avg_time_minutes: parseFloat(stats.avg_time_minutes)?.toFixed(2) || 0,
        total_revenue: parseFloat(stats.total_revenue) || 0,
      };
    } catch (error) {
      logger.error('Error fetching cook stats', { cookId, error: error.message });
      throw error;
    }
  }
}

module.exports = KitchenService;
