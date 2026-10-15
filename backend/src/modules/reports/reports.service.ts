import { prisma } from '../../lib/prisma';

export class ReportsService {
  /**
   * Estadísticas diarias del restaurante para una fecha (YYYY-MM-DD o hoy)
   */
  static async getDailyStats(dateStr?: string) {
    const today = dateStr ? new Date(`${dateStr}T00:00:00.000Z`) : new Date();
    const startOfDay = new Date(today);
    startOfDay.setUTCHours(0, 0, 0, 0);

    const endOfDay = new Date(today);
    endOfDay.setUTCHours(23, 59, 59, 999);

    const orders = await prisma.orders.findMany({
      where: {
        created_at: {
          gte: startOfDay,
          lte: endOfDay,
        },
      },
      select: {
        id: true,
        status: true,
        total_amount: true,
        cancel_reason: true,
        created_at: true,
        completed_at: true,
      },
    });

    let totalOrders = 0;
    let pendingOrders = 0;
    let assignedOrders = 0;
    let inProgressOrders = 0;
    let readyOrders = 0;
    let deliveredOrders = 0;
    let paidOrders = 0;
    let cancelledOrders = 0;
    let totalRevenue = 0;

    // Desglose por método de pago para arqueo de caja
    let cashRevenue = 0;
    let cardRevenue = 0;
    let transferRevenue = 0;
    let otherRevenue = 0;

    const completionMinutesList: number[] = [];
    const delayedOrdersCount = orders.filter((o) => {
      if (['pending', 'assigned', 'in_progress'].includes(o.status) && o.created_at) {
        const diffMinutes = (Date.now() - o.created_at.getTime()) / (1000 * 60);
        return diffMinutes > 20;
      }
      return false;
    }).length;

    for (const order of orders) {
      totalOrders++;
      switch (order.status) {
        case 'pending':
          pendingOrders++;
          break;
        case 'assigned':
          assignedOrders++;
          break;
        case 'in_progress':
          inProgressOrders++;
          break;
        case 'ready_to_deliver':
          readyOrders++;
          break;
        case 'delivered':
          deliveredOrders++;
          break;
        case 'paid': {
          paidOrders++;
          const amount = Number(order.total_amount || 0);
          totalRevenue += amount;

          // Clasificar método de pago desde cancel_reason
          const reason = (order.cancel_reason || '').toLowerCase();
          if (reason.includes('tarjeta')) {
            cardRevenue += amount;
          } else if (reason.includes('transferencia') || reason.includes('mp') || reason.includes('mercado')) {
            transferRevenue += amount;
          } else if (reason.includes('efectivo')) {
            cashRevenue += amount;
          } else {
            // Por defecto en restaurante tradicional si no se especificó
            cashRevenue += amount;
          }
          break;
        }
        case 'cancelled':
          cancelledOrders++;
          break;
      }

      if (order.completed_at && order.created_at) {
        const diffMs = order.completed_at.getTime() - order.created_at.getTime();
        const diffMinutes = diffMs / (1000 * 60);
        if (diffMinutes >= 0) {
          completionMinutesList.push(diffMinutes);
        }
      }
    }

    const avgCompletionTimeMinutes =
      completionMinutesList.length > 0
        ? Math.round(
            completionMinutesList.reduce((acc, curr) => acc + curr, 0) /
              completionMinutesList.length
          )
        : 0;

    return {
      date: startOfDay.toISOString().split('T')[0],
      total_orders: totalOrders,
      pending_orders: pendingOrders,
      assigned_orders: assignedOrders,
      in_progress_orders: inProgressOrders,
      ready_orders: readyOrders,
      delivered_orders: deliveredOrders,
      paid_orders: paidOrders,
      cancelled_orders: cancelledOrders,
      total_revenue: totalRevenue,
      payment_breakdown: {
        cash: cashRevenue,
        card: cardRevenue,
        transfer: transferRevenue,
        other: otherRevenue,
      },
      avg_completion_time_minutes: avgCompletionTimeMinutes,
      delayed_orders_count: delayedOrdersCount,
    };
  }

  /**
   * Platos más vendidos (Top selling)
   */
  static async getTopItems(limit = 5) {
    const today = new Date();
    today.setUTCHours(0, 0, 0, 0);

    const orderLines = await prisma.order_lines.findMany({
      where: {
        orders: {
          status: { in: ['paid', 'delivered', 'ready_to_deliver', 'in_progress'] },
          created_at: { gte: today },
        },
      },
      include: {
        menu_items: {
          select: { id: true, name: true, category: true, price: true },
        },
      },
    });

    const itemMap = new Map<
      number,
      { id: number; name: string; category: string | null; totalQuantity: number; totalRevenue: number }
    >();

    for (const line of orderLines) {
      const item = line.menu_items;
      const current = itemMap.get(item.id) || {
        id: item.id,
        name: item.name,
        category: item.category,
        totalQuantity: 0,
        totalRevenue: 0,
      };

      current.totalQuantity += line.quantity;
      current.totalRevenue += Number(line.unit_price) * line.quantity;
      itemMap.set(item.id, current);
    }

    const topItems = Array.from(itemMap.values())
      .sort((a, b) => b.totalQuantity - a.totalQuantity)
      .slice(0, limit);

    return topItems;
  }

  /**
   * Proyección de compra de insumos:
   * Calcula la reposición estrictamente en base a lo vendido en la noche anterior (último servicio),
   * aplicando las recetas reales de cada plato vendido (ej: 200g carne, 1 pan, 1 huevo, etc.)
   * y contrastándolo con el stock actual disponible en depósito.
   */
  static async getPurchaseProjection() {
    const ingredients = await prisma.ingredients.findMany({
      orderBy: { name: 'asc' },
    });

    // 1. Encontrar la última jornada/turno nocturno donde hubo pedidos
    const lastOrder = await prisma.orders.findFirst({
      where: {
        status: { in: ['paid', 'delivered', 'ready_to_deliver', 'in_progress', 'assigned'] },
      },
      orderBy: { created_at: 'desc' },
      select: { created_at: true },
    });

    const ingredientConsumption = new Map<
      number,
      { consumed: number; dishBreakdown: string[] }
    >();

    let referenceDateLabel = 'Sin ventas registradas aún';

    if (lastOrder && lastOrder.created_at) {
      const refDate = new Date(lastOrder.created_at);
      referenceDateLabel = refDate.toISOString().split('T')[0];

      // Ventana de turno nocturno: desde las 18:00 del día de inicio hasta las 08:00 del día siguiente
      const windowStart = new Date(refDate);
      if (windowStart.getHours() < 8) {
        windowStart.setDate(windowStart.getDate() - 1);
      }
      windowStart.setHours(18, 0, 0, 0);

      const windowEnd = new Date(windowStart);
      windowEnd.setDate(windowEnd.getDate() + 1);
      windowEnd.setHours(8, 0, 0, 0);

      // Buscar pedidos de esa ventana de servicio
      let recentOrders = await prisma.orders.findMany({
        where: {
          created_at: { gte: windowStart, lte: windowEnd },
          status: { notIn: ['cancelled'] },
        },
        include: {
          order_lines: {
            include: {
              menu_items: {
                include: {
                  recipes: true,
                },
              },
            },
          },
        },
      });

      // Si no hubo pedidos en esa ventana exacta nocturna, ampliar a todo el día calendario del último pedido
      if (recentOrders.length === 0) {
        const dayStart = new Date(refDate);
        dayStart.setHours(0, 0, 0, 0);
        const dayEnd = new Date(refDate);
        dayEnd.setHours(23, 59, 59, 999);

        recentOrders = await prisma.orders.findMany({
          where: {
            created_at: { gte: dayStart, lte: dayEnd },
            status: { notIn: ['cancelled'] },
          },
          include: {
            order_lines: {
              include: {
                menu_items: {
                  include: {
                    recipes: true,
                  },
                },
              },
            },
          },
        });
      }

      // 2. Multiplicar cada plato vendido por las cantidades de su receta
      for (const order of recentOrders) {
        for (const line of order.order_lines) {
          const item = line.menu_items;
          const qtySold = line.quantity;

          for (const recipe of item.recipes) {
            const ingId = recipe.ingredient_id;
            const requiredPerDish = Number(recipe.quantity_required);
            const totalConsumed = qtySold * requiredPerDish;

            const current = ingredientConsumption.get(ingId) || {
              consumed: 0,
              dishBreakdown: [],
            };
            current.consumed += totalConsumed;

            const dishSummary = `${qtySold}x ${item.name}`;
            if (!current.dishBreakdown.includes(dishSummary)) {
              current.dishBreakdown.push(dishSummary);
            }
            ingredientConsumption.set(ingId, current);
          }
        }
      }
    }

    // 3. Proyectar compra para cada ingrediente
    return ingredients.map((ing) => {
      const currentStock = Number(ing.current_stock || 0);
      const minStock = Number(ing.min_stock || 0);
      const unitCost = Number(ing.unit_cost || 0);

      const consumptionData = ingredientConsumption.get(ing.id);
      const consumedLastNight = consumptionData
        ? Math.round(consumptionData.consumed * 1000) / 1000
        : 0;

      // Lógica de compra dependiente de la noche anterior:
      // Se proyecta tener suficiente para repetir la noche anterior sin perforar el stock de seguridad
      let suggestedToBuy = 0;
      if (consumedLastNight > 0) {
        if (currentStock < consumedLastNight) {
          suggestedToBuy = consumedLastNight - currentStock;
        }
        if (currentStock - consumedLastNight < minStock) {
          const deficitSafety = minStock - Math.max(0, currentStock - consumedLastNight);
          suggestedToBuy = Math.max(suggestedToBuy, deficitSafety);
        }
      } else if (currentStock < minStock) {
        suggestedToBuy = minStock - currentStock;
      }

      suggestedToBuy = Math.ceil(suggestedToBuy * 10) / 10;
      const estimatedCost = Math.round(suggestedToBuy * unitCost * 100) / 100;

      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        current_stock: currentStock,
        min_stock: minStock,
        unit_cost: unitCost,
        consumed_today: consumedLastNight, // Retrocompatibilidad
        consumed_last_night: consumedLastNight,
        reference_shift: referenceDateLabel,
        dishes_summary: consumptionData ? consumptionData.dishBreakdown.join(', ') : null,
        is_low_stock:
          currentStock < minStock || (consumedLastNight > 0 && currentStock < consumedLastNight),
        suggested_to_buy: suggestedToBuy,
        estimated_cost: estimatedCost,
      };
    });
  }

  /**
   * Cierre y Arqueo de Caja del Turno:
   * Calcula el balance del turno considerando un fondo inicial ingresado por el encargado.
   */
  static async getCashShiftSummary(initialCash: number = 0, dateStr?: string) {
    const stats = await this.getDailyStats(dateStr);
    const breakdown = stats.payment_breakdown;

    const totalCalculatedCash = initialCash + breakdown.cash;

    return {
      date: stats.date,
      initial_cash: initialCash,
      cash_sales: breakdown.cash,
      card_sales: breakdown.card,
      transfer_sales: breakdown.transfer,
      total_sales: stats.total_revenue,
      expected_cash_in_drawer: totalCalculatedCash,
      total_orders_paid: stats.paid_orders,
      closed_at: new Date().toISOString(),
    };
  }
}
