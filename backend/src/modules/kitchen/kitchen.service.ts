import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { emitOrderStatusChanged } from '../../lib/websocket';

export class KitchenService {
  /**
   * Cola de pedidos pendientes en orden FIFO (sin datos económicos)
   */
  static async getQueue() {
    const orders = await prisma.orders.findMany({
      where: {
        status: 'pending',
        assigned_cook_id: null,
      },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        table_number: true,
        status: true,
        created_at: true,
        order_lines: {
          select: {
            id: true,
            menu_item_id: true,
            quantity: true,
            notes: true,
            menu_items: {
              select: {
                id: true,
                name: true,
                category: true,
                image_url: true,
              },
            },
          },
        },
      },
    });

    return orders;
  }

  /**
   * Pedidos tomados o en preparación por el cocinero actual
   */
  static async getMyOrders(cookId: number) {
    const orders = await prisma.orders.findMany({
      where: {
        assigned_cook_id: cookId,
        status: { in: ['assigned', 'in_progress'] },
      },
      orderBy: { created_at: 'asc' },
      select: {
        id: true,
        table_number: true,
        status: true,
        created_at: true,
        assigned_at: true,
        started_at: true,
        order_lines: {
          select: {
            id: true,
            menu_item_id: true,
            quantity: true,
            notes: true,
            menu_items: {
              select: {
                id: true,
                name: true,
                category: true,
              },
            },
          },
        },
      },
    });

    return orders;
  }

  /**
   * Pedidos listos para entregar (notificando al mozo)
   */
  static async getReadyOrders() {
    const orders = await prisma.orders.findMany({
      where: { status: 'ready_to_deliver' },
      orderBy: { completed_at: 'desc' },
      take: 10,
      select: {
        id: true,
        table_number: true,
        status: true,
        completed_at: true,
        order_lines: {
          select: {
            id: true,
            quantity: true,
            menu_items: {
              select: { name: true },
            },
          },
        },
      },
    });

    return orders;
  }

  /**
   * Auto-asignar pedido de la cola general a este cocinero
   */
  static async takeOrder(orderId: number, cookId: number) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Pedido no encontrado');

    if (order.status !== 'pending' || order.assigned_cook_id !== null) {
      throw new Error('Este pedido ya fue tomado por otro cocinero');
    }

    const updated = await prisma.orders.update({
      where: { id: orderId },
      data: {
        assigned_cook_id: cookId,
        status: 'assigned',
        assigned_at: new Date(),
      },
      select: {
        id: true,
        table_number: true,
        status: true,
        assigned_at: true,
      },
    });

    logger.info({ orderId, cookId }, 'Cocinero tomó el pedido');
    emitOrderStatusChanged(updated);
    return updated;
  }

  /**
   * Marcar pedido como en preparación (empieza a cocinarse)
   */
  static async startOrder(orderId: number, cookId: number) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Pedido no encontrado');

    if (order.assigned_cook_id !== cookId) {
      throw new Error('Solo el cocinero asignado puede iniciar este pedido');
    }

    const updated = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: 'in_progress',
        started_at: new Date(),
      },
      select: {
        id: true,
        table_number: true,
        status: true,
        started_at: true,
      },
    });

    logger.info({ orderId, cookId }, 'Pedido en preparación en cocina');
    emitOrderStatusChanged(updated);
    return updated;
  }

  /**
   * Marcar pedido como listo para entregar al mozo
   */
  static async completeOrder(orderId: number, cookId: number) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Pedido no encontrado');

    if (order.assigned_cook_id !== cookId) {
      throw new Error('Solo el cocinero asignado puede marcar como listo este pedido');
    }

    const updated = await prisma.orders.update({
      where: { id: orderId },
      data: {
        status: 'ready_to_deliver',
        completed_at: new Date(),
      },
      select: {
        id: true,
        table_number: true,
        status: true,
        completed_at: true,
      },
    });

    logger.info({ orderId, cookId }, 'Pedido listo para entregar');
    emitOrderStatusChanged(updated);
    return updated;
  }

  /**
   * Consulta de receta de un plato para el cocinero
   */
  static async getRecipeForDish(menuItemId: number) {
    const dish = await prisma.menu_items.findUnique({
      where: { id: menuItemId },
      select: {
        id: true,
        name: true,
        recipes: {
          select: {
            id: true,
            quantity_required: true,
            instructions: true,
            ingredients: {
              select: {
                name: true,
                unit: true,
              },
            },
          },
        },
      },
    });

    if (!dish) throw new Error('Plato no encontrado');

    return {
      dishId: dish.id,
      dishName: dish.name,
      ingredients: dish.recipes.map((r) => ({
        name: r.ingredients.name,
        quantity: Number(r.quantity_required),
        unit: r.ingredients.unit,
        instructions: r.instructions,
      })),
    };
  }
}
