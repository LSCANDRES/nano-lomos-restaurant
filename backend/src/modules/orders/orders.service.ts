import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Prisma } from '@prisma/client';
import { emitOrderCreated, emitOrderStatusChanged, emitLowStockAlert } from '../../lib/websocket';

export interface CreateOrderItemDto {
  menuItemId: number;
  quantity: number;
  notes?: string;
}

export interface CreateOrderDto {
  customerId?: number;
  customerName?: string;
  customerPhone?: string;
  deliveryAddress?: string;
  orderType?: 'mostrador' | 'takeaway' | 'delivery' | 'salon';
  tableId?: number;
  tableNumber?: string;
  items: CreateOrderItemDto[];
  createdBy: number;
  paymentMethod?: string;
  paymentNotes?: string;
}

export class OrdersService {
  /**
   * Helper unificado para estructurar respuestas de órdenes con paridad Mostrador / Takeaway
   */
  static formatOrder(order: any, orderTypeOverride?: string) {
    const paymentMatch = order.cancel_reason?.match(/\[PAGO:\s*([^\]]+)\]/);
    const dirMatch = order.cancel_reason?.match(/\[DIR:\s*([^\]]+)\]/);

    const isDelivery = order.table_number?.toUpperCase().startsWith('DELIVERY');
    const isRetiro = order.table_number?.toUpperCase().startsWith('RETIRO');

    return {
      ...order,
      order_type: orderTypeOverride || (isDelivery ? 'delivery' : isRetiro ? 'takeaway' : 'mostrador'),
      turn_number: order.table_number,
      payment_method: paymentMatch ? paymentMatch[1] : null,
      delivery_address: dirMatch ? dirMatch[1] : null,
      total_amount: Number(order.total_amount),
      order_lines: order.order_lines ? order.order_lines.map((l: any) => ({
        ...l,
        unit_price: Number(l.unit_price),
      })) : [],
    };
  }

  /**
   * Descuenta stock de ingredientes según recetas para un pedido dado.
   * Es idempotente: verifica si ya existen registros de consumo para este pedido.
   */
  static async deductStockForOrder(orderId: number, userId: number, tx: Prisma.TransactionClient = prisma) {
    // 1. Evitar doble descuento comprobando transacciones existentes
    const existing = await tx.stock_transactions.findFirst({
      where: {
        reference_id: orderId,
        reference_type: 'order',
        transaction_type: 'usage',
      },
    });

    if (existing) {
      logger.info({ orderId }, 'Stock para comanda ya descontado previamente (idempotente).');
      return;
    }

    // 2. Obtener comanda con recetas vinculadas
    const order = await tx.orders.findUnique({
      where: { id: orderId },
      include: {
        order_lines: {
          include: {
            menu_items: {
              include: {
                recipes: {
                  include: {
                    ingredients: true,
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!order) return;

    for (const line of order.order_lines) {
      for (const recipe of line.menu_items.recipes) {
        const totalRequired = recipe.quantity_required.mul(line.quantity);

        // Descontar del inventario
        const updatedIng = await tx.ingredients.update({
          where: { id: recipe.ingredient_id },
          data: {
            current_stock: {
              decrement: totalRequired,
            },
          },
        });

        // Disparar alerta si el stock cae por debajo del mínimo
        if (Number(updatedIng.current_stock) < Number(updatedIng.min_stock)) {
          emitLowStockAlert({
            id: updatedIng.id,
            name: updatedIng.name,
            current_stock: Number(updatedIng.current_stock),
            min_stock: Number(updatedIng.min_stock),
          });
        }

        // Registrar en stock_transactions
        await tx.stock_transactions.create({
          data: {
            ingredient_id: recipe.ingredient_id,
            transaction_type: 'usage',
            quantity: totalRequired.negated(),
            reference_id: orderId,
            reference_type: 'order',
            notes: `Consumo comanda #${orderId} (${order.table_number || 'Mostrador'}) - Plato: ${line.menu_items.name} (x${line.quantity})`,
            created_by: userId,
          },
        });
      }
    }

    logger.info({ orderId }, 'Stock de ingredientes descontado exitosamente por comanda');
  }

  /**
   * Restaura el stock de ingredientes si una comanda con descuento previo es cancelada.
   */
  static async restoreStockForOrder(orderId: number, userId: number, tx: Prisma.TransactionClient = prisma) {
    const usages = await tx.stock_transactions.findMany({
      where: {
        reference_id: orderId,
        reference_type: 'order',
        transaction_type: 'usage',
      },
    });

    if (usages.length === 0) return;

    for (const usage of usages) {
      const restoreQty = usage.quantity.abs();

      await tx.ingredients.update({
        where: { id: usage.ingredient_id },
        data: {
          current_stock: {
            increment: restoreQty,
          },
        },
      });

      await tx.stock_transactions.create({
        data: {
          ingredient_id: usage.ingredient_id,
          transaction_type: 'reversal',
          quantity: restoreQty,
          reference_id: orderId,
          reference_type: 'order',
          notes: `Reversión de consumo por cancelación de comanda #${orderId}`,
          created_by: userId,
        },
      });
    }

    logger.info({ orderId, itemsCount: usages.length }, 'Stock restaurado tras cancelación de comanda');
  }

  static async createOrder(data: CreateOrderDto) {
    if (!data.items || data.items.length === 0) {
      throw new Error('El pedido debe incluir al menos un plato.');
    }

    // 1. Validar platos y calcular precios
    const menuItemIds = data.items.map((i) => i.menuItemId);
    const menuItems = await prisma.menu_items.findMany({
      where: { id: { in: menuItemIds } },
    });

    if (menuItems.length !== menuItemIds.length) {
      throw new Error('Uno o más platos seleccionados no existen en el menú.');
    }

    const itemsMap = new Map(menuItems.map((m) => [m.id, m]));

    // Validar disponibilidad
    for (const item of data.items) {
      const menuItem = itemsMap.get(item.menuItemId);
      if (!menuItem?.is_active) {
        throw new Error(`El plato "${menuItem?.name || item.menuItemId}" no está disponible.`);
      }
      if (item.quantity <= 0) {
        throw new Error('La cantidad de cada plato debe ser mayor a 0.');
      }
    }

    let totalAmount = new Prisma.Decimal(0);
    const orderLinesData = data.items.map((item) => {
      const menuItem = itemsMap.get(item.menuItemId)!;
      const subtotal = menuItem.price.mul(item.quantity);
      totalAmount = totalAmount.add(subtotal);

      return {
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: menuItem.price,
        notes: item.notes?.trim() || null,
      };
    });

    // 2. Determinar o registrar cliente si vino nombre o teléfono
    let customerId = data.customerId;
    if (!customerId && (data.customerName || data.customerPhone)) {
      try {
        const nameParts = (data.customerName || 'Cliente').trim().split(' ');
        const firstName = nameParts[0] || 'Cliente';
        const lastName = nameParts.slice(1).join(' ') || 'Mostrador';
        const phone = data.customerPhone?.trim() || null;

        let existingCust = phone
          ? await prisma.customers.findFirst({ where: { phone } })
          : null;

        if (!existingCust) {
          existingCust = await prisma.customers.create({
            data: {
              first_name: firstName,
              last_name: lastName,
              phone: phone,
            },
          });
        }
        customerId = existingCust.id;
      } catch (err) {
        logger.warn({ err }, 'No se pudo vincular/crear cliente para el pedido');
      }
    }

    // 3. Determinar número / etiqueta de comanda
    let tableNum = data.tableNumber;
    if (data.tableId && !tableNum) {
      const table = await prisma.tables.findUnique({ where: { id: data.tableId } });
      tableNum = table ? table.number : undefined;
    }

    if (!tableNum) {
      const prefix = data.orderType === 'delivery'
        ? 'DELIV'
        : data.orderType === 'takeaway'
        ? 'RETIRO'
        : 'MOST';
      const clientTag = data.customerName ? `-${data.customerName.trim().slice(0, 14)}` : '';
      tableNum = `${prefix}${clientTag}`.slice(0, 20);
    } else {
      tableNum = tableNum.slice(0, 20);
    }

    // Construir metadatos adicionales (dirección de delivery o notas)
    let metaReason: string | null = null;
    if (data.deliveryAddress) {
      metaReason = `[DIR: ${data.deliveryAddress.trim()}]`;
    }
    if (data.paymentMethod) {
      const payStr = `[PAGO: ${data.paymentMethod.toUpperCase()}${data.paymentNotes ? ` - ${data.paymentNotes}` : ''}]`;
      metaReason = metaReason ? `${metaReason} ${payStr}` : payStr;
    }

    // 4. Crear pedido en transacción y descontar stock automáticamente si ya fue cobrado al mostrador
    const order = await prisma.$transaction(async (tx) => {
      const newOrder = await tx.orders.create({
        data: {
          customer_id: customerId || null,
          table_id: data.tableId || null,
          table_number: tableNum,
          status: 'pending',
          cancel_reason: metaReason,
          total_amount: totalAmount,
          created_by: data.createdBy,
          order_lines: {
            create: orderLinesData,
          },
        },
        include: {
          order_lines: {
            include: {
              menu_items: {
                select: { name: true, category: true, image_url: true },
              },
            },
          },
        },
      });

      // Si el pedido cuenta con método de pago informado al mostrador, descontar inventario de inmediato
      if (data.paymentMethod) {
        await OrdersService.deductStockForOrder(newOrder.id, data.createdBy, tx);
      }

      return newOrder;
    });

    logger.info({ orderId: order.id, total: Number(order.total_amount), type: data.orderType || 'salon' }, 'Pedido creado exitosamente');

    const formattedOrder = OrdersService.formatOrder(order, data.orderType);

    // Notificar en tiempo real por WebSocket a Cocina y Gerente
    emitOrderCreated(formattedOrder);

    return formattedOrder;
  }

  static async getAllOrders(filters: { status?: string; tableId?: number } = {}) {
    const where: Prisma.ordersWhereInput = {};
    if (filters.status) {
      where.status = filters.status;
    }
    if (filters.tableId) {
      where.table_id = filters.tableId;
    }

    const orders = await prisma.orders.findMany({
      where,
      orderBy: { created_at: 'desc' },
      include: {
        tables: true,
        customers: true,
        users_orders_created_byTousers: {
          select: { id: true, full_name: true, username: true },
        },
        users_orders_assigned_cook_idTousers: {
          select: { id: true, full_name: true, username: true },
        },
        order_lines: {
          include: {
            menu_items: {
              select: { id: true, name: true, category: true },
            },
          },
        },
      },
    });

    return orders.map((o) => OrdersService.formatOrder(o));
  }

  static async getOrderById(id: number) {
    const order = await prisma.orders.findUnique({
      where: { id },
      include: {
        tables: true,
        customers: true,
        users_orders_created_byTousers: {
          select: { id: true, full_name: true, username: true },
        },
        users_orders_assigned_cook_idTousers: {
          select: { id: true, full_name: true, username: true },
        },
        order_lines: {
          include: {
            menu_items: true,
          },
        },
      },
    });

    if (!order) {
      throw new Error('Pedido no encontrado');
    }

    return OrdersService.formatOrder(order);
  }

  /**
   * Marcar pedido como entregado (mozo o mostrador)
   */
  static async deliverOrder(orderId: number, _userId: number) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Pedido no encontrado');

    const updated = await prisma.orders.update({
      where: { id: orderId },
      data: { status: 'delivered' },
    });

    logger.info({ orderId }, 'Pedido marcado como entregado');
    emitOrderStatusChanged(updated);
    return OrdersService.formatOrder(updated);
  }

  /**
   * Marcar pedido como pagado y cobrar:
   * Dispara el consumo real de ingredientes según las recetas en una transacción atómica
   * (con protección de idempotencia si ya se descontó al crear la comanda).
   */
  static async payOrder(orderId: number, userId: number, paymentMethod: string = 'efectivo', notes?: string) {
    const order = await prisma.orders.findUnique({
      where: { id: orderId },
    });

    if (!order) throw new Error('Pedido no encontrado');
    if (order.status === 'paid') throw new Error('El pedido ya fue pagado');

    const paymentNote = `[PAGO: ${paymentMethod.toUpperCase()}]${notes ? ` ${notes}` : ''}`;

    const result = await prisma.$transaction(async (tx) => {
      // 1. Cambiar estado a paid y registrar método de pago en cancel_reason como nota contable
      const updatedOrder = await tx.orders.update({
        where: { id: orderId },
        data: {
          status: 'paid',
          cancel_reason: paymentNote,
        },
      });

      // 2. Descontar stock de ingredientes y registrar movimientos (si no fue descontado previamente)
      await OrdersService.deductStockForOrder(orderId, userId, tx);

      logger.info({ orderId }, 'Pedido cobrado y stock de ingredientes verificado/descontado');
      return updatedOrder;
    });

    emitOrderStatusChanged(result);
    return OrdersService.formatOrder(result);
  }

  /**
   * Cancelar comanda con motivo y restaurar stock automáticamente si fue consumido
   */
  static async cancelOrder(orderId: number, cancelReason: string, userId: number, userRole: string) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Pedido no encontrado');

    if (order.status === 'paid') {
      throw new Error('No se puede cancelar un pedido ya cobrado');
    }

    if ((order.status === 'in_progress' || order.status === 'ready_to_deliver') && userRole !== 'manager' && userRole !== 'admin') {
      throw new Error('El pedido ya está en preparación. Solo el gerente puede cancelarlo.');
    }

    const updated = await prisma.$transaction(async (tx) => {
      // Revertir consumos de stock si existieron para esta comanda
      await OrdersService.restoreStockForOrder(orderId, userId, tx);

      return await tx.orders.update({
        where: { id: orderId },
        data: {
          status: 'cancelled',
          cancel_reason: cancelReason,
        },
      });
    });

    logger.info({ orderId, reason: cancelReason }, 'Pedido cancelado y stock revertido');
    emitOrderStatusChanged(updated);
    return OrdersService.formatOrder(updated);
  }

  /**
   * Asignar un pedido a un cocinero específico desde Cajero Mostrador o Gerente
   */
  static async assignCook(orderId: number, cookId: number) {
    const order = await prisma.orders.findUnique({ where: { id: orderId } });
    if (!order) throw new Error('Pedido no encontrado');

    if (order.status === 'paid' || order.status === 'cancelled' || order.status === 'delivered') {
      throw new Error(`No se puede asignar un pedido en estado ${order.status}`);
    }

    const cook = await prisma.users.findUnique({ where: { id: cookId } });
    if (!cook || (cook.role !== 'cook' && cook.role !== 'admin')) {
      throw new Error('El usuario seleccionado debe tener rol de cocinero');
    }

    const updated = await prisma.orders.update({
      where: { id: orderId },
      data: {
        assigned_cook_id: cookId,
        status: order.status === 'pending' ? 'assigned' : order.status,
        assigned_at: order.assigned_at || new Date(),
      },
      include: {
        tables: true,
        customers: true,
        users_orders_assigned_cook_idTousers: {
          select: { id: true, full_name: true, username: true },
        },
        order_lines: {
          include: {
            menu_items: {
              select: { id: true, name: true, category: true },
            },
          },
        },
      },
    });

    logger.info({ orderId, cookId, cookName: cook.full_name }, 'Pedido asignado a cocinero');
    emitOrderStatusChanged(updated);
    return OrdersService.formatOrder(updated);
  }

  /**
   * Obtener cocineros activos con conteo de comandas en preparación
   */
  static async getAvailableCooks() {
    const cooks = await prisma.users.findMany({
      where: {
        role: 'cook',
        is_active: true,
      },
      select: {
        id: true,
        username: true,
        full_name: true,
        avatar_url: true,
        orders_orders_assigned_cook_idTousers: {
          where: {
            status: { in: ['assigned', 'in_progress'] },
          },
          select: { id: true },
        },
      },
      orderBy: { full_name: 'asc' },
    });

    return cooks.map((c) => ({
      id: c.id,
      username: c.username,
      fullName: c.full_name,
      avatarUrl: c.avatar_url,
      activeOrdersCount: c.orders_orders_assigned_cook_idTousers.length,
    }));
  }
}
