const Order = require('../models/Order');
const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');
const validator = require('../utils/validators');
const { broadcastToKitchen, broadcastToManagers, broadcastToOrderTakers, sendToCook } = require('../websocket/socketHandler');

class OrderService {
  // FR-001, FR-002, FR-003, FR-004: Create order with validation
  static async createOrder({ customerId, tableNumber, items, createdBy }) {
    try {
      // Validate inputs
      if (!items || items.length === 0) {
        throw new Error('El pedido debe contener al menos un item');
      }

      if (!createdBy) {
        throw new Error('Usuario creador requerido');
      }

      // FR-024: Validate stock availability BEFORE creating order
      const availabilityChecks = await Promise.all(
        items.map(async (item) => {
          const menuItem = await MenuItem.findById(item.menuItemId);
          if (!menuItem) {
            return {
              valid: false,
              menuItemId: item.menuItemId,
              error: `Item de menú ${item.menuItemId} no existe`,
            };
          }

          if (!menuItem.is_active) {
            return {
              valid: false,
              menuItemId: item.menuItemId,
              menuItemName: menuItem.name,
              error: `${menuItem.name} no está disponible`,
            };
          }

          // Check ingredient availability
          const availability = await MenuItem.checkAvailability(item.menuItemId);
          if (!availability.available) {
            return {
              valid: false,
              menuItemId: item.menuItemId,
              menuItemName: menuItem.name,
              missingIngredients: availability.missingIngredients,
              error: `Stock insuficiente para ${menuItem.name}`,
            };
          }

          return {
            valid: true,
            menuItem,
          };
        })
      );

      // Check if any items failed validation
      const invalidItems = availabilityChecks.filter((check) => !check.valid);
      if (invalidItems.length > 0) {
        const errorDetails = invalidItems.map((item) => {
          if (item.missingIngredients) {
            const ingredients = item.missingIngredients
              .map((ing) => `${ing.ingredient_name} (disponible: ${ing.current_stock} ${ing.unit}, requerido: ${ing.quantity_required} ${ing.unit})`)
              .join(', ');
            return `${item.menuItemName}: ${ingredients}`;
          }
          return item.error;
        });

        throw new Error(
          `No se puede crear el pedido. Ingredientes insuficientes:\n${errorDetails.join('\n')}`
        );
      }

      // All items valid, add prices to items
      const itemsWithPrices = items.map((item, index) => ({
        ...item,
        unitPrice: availabilityChecks[index].menuItem.price,
      }));

      // Create order
      const order = await Order.create({
        customerId,
        tableNumber,
        createdBy,
        items: itemsWithPrices,
      });

      logger.info(`Order created: ${order.id} by user ${createdBy}`, {
        orderId: order.id,
        itemCount: items.length,
      });

      // Broadcast to kitchen and managers
      broadcastToKitchen('order:new', order);
      broadcastToManagers('order:new', order);

      return order;
    } catch (error) {
      logger.error('Error creating order', { error: error.message });
      throw error;
    }
  }

  // FR-005: Search and view specific orders
  static async getOrderById(id) {
    try {
      const order = await Order.findById(id);
      if (!order) {
        throw new Error('Pedido no encontrado');
      }
      return order;
    } catch (error) {
      logger.error('Error fetching order', { id, error: error.message });
      throw error;
    }
  }

  static async getAllOrders({ status, assignedCookId } = {}) {
    try {
      return await Order.findAll({ status, assignedCookId });
    } catch (error) {
      logger.error('Error fetching orders', { error: error.message });
      throw error;
    }
  }

  // FR-006A: Manual assignment by order_taker
  static async assignOrderToCook(orderId, cookId, userId) {
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Pedido no encontrado');
      }

      // Allow assignment/reassignment only for pending or assigned orders
      if (order.status !== 'pending' && order.status !== 'assigned') {
        throw new Error(`No se puede asignar: pedido en estado ${order.status}`);
      }

      const updatedOrder = await Order.assignToCook(orderId, cookId);
      
      logger.info(`Order ${orderId} manually assigned to cook ${cookId} by user ${userId}`);

      // Notify cook and managers
      sendToCook(cookId, 'order:assigned', updatedOrder);
      broadcastToManagers('order:assigned', updatedOrder);
      broadcastToOrderTakers('order:assigned', updatedOrder);

      return updatedOrder;
    } catch (error) {
      logger.error('Error assigning order to cook', { orderId, cookId, error: error.message });
      throw error;
    }
  }

  // FR-008, FR-006B: Update order status (by cook OR order_taker)
  static async updateOrderStatus(orderId, status, userId, userRole) {
    try {
      if (!validator.isValidOrderStatus(status)) {
        throw new Error(`Estado inválido: ${status}`);
      }

      const order = await Order.findById(orderId);
      if (!order) {
        throw new Error('Pedido no encontrado');
      }

      // FR-006B: Allow order_taker to update status
      if (userRole === 'order_taker' || (userRole === 'cook' && order.assigned_cook_id === userId)) {
        const updatedOrder = await Order.updateStatus(orderId, status, {
          timestamp: new Date(),
        });

        logger.info(`Order ${orderId} status updated to ${status} by ${userRole} ${userId}`);

        // Broadcast status change
        broadcastToKitchen('order:status_changed', updatedOrder);
        broadcastToManagers('order:status_changed', updatedOrder);
        broadcastToOrderTakers('order:status_changed', updatedOrder);
        
        if (order.assigned_cook_id) {
          sendToCook(order.assigned_cook_id, 'order:status_changed', updatedOrder);
        }

        return updatedOrder;
      } else {
        throw new Error('No tienes permiso para actualizar este pedido');
      }
    } catch (error) {
      logger.error('Error updating order status', { orderId, status, error: error.message });
      throw error;
    }
  }

  // FR-006: FIFO automatic assignment (called when cook becomes available)
  static async autoAssignNextOrder(cookId) {
    try {
      const oldestPending = await Order.getOldestPending();
      
      if (!oldestPending) {
        logger.info(`No pending orders available for auto-assignment to cook ${cookId}`);
        return null;
      }

      const updatedOrder = await Order.assignToCook(oldestPending.id, cookId);
      
      logger.info(`Order ${oldestPending.id} auto-assigned (FIFO) to cook ${cookId}`);

      // Notify cook and managers
      sendToCook(cookId, 'order:assigned', updatedOrder);
      broadcastToManagers('order:assigned', updatedOrder);
      broadcastToKitchen('order:assigned', updatedOrder);

      return updatedOrder;
    } catch (error) {
      logger.error('Error auto-assigning order', { cookId, error: error.message });
      throw error;
    }
  }

  static async getPendingOrders() {
    try {
      return await Order.getPendingOrders();
    } catch (error) {
      logger.error('Error fetching pending orders', { error: error.message });
      throw error;
    }
  }
}

module.exports = OrderService;
