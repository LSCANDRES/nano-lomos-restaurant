import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Prisma } from '@prisma/client';

export interface RestockIngredientDto {
  ingredientId: number;
  quantity: number;
  notes?: string;
  userId?: number;
}

export class InventoryService {
  /**
   * Obtener todos los ingredientes con stock actual vs stock mínimo
   */
  static async getAllIngredients() {
    const ingredients = await prisma.ingredients.findMany({
      orderBy: { name: 'asc' },
    });

    return ingredients.map((ing) => ({
      id: ing.id,
      name: ing.name,
      unit: ing.unit,
      current_stock: Number(ing.current_stock || 0),
      min_stock: Number(ing.min_stock || 0),
      unit_cost: Number(ing.unit_cost || 0),
      is_low_stock: Number(ing.current_stock || 0) < Number(ing.min_stock || 0),
      created_at: ing.created_at,
      updated_at: ing.updated_at,
    }));
  }

  /**
   * Ingreso o ajuste de stock (compra/recepción de insumo)
   */
  static async restockIngredient(dto: RestockIngredientDto) {
    if (dto.quantity <= 0) {
      throw new Error('La cantidad a ingresar debe ser mayor a 0.');
    }

    const ingredient = await prisma.ingredients.findUnique({
      where: { id: dto.ingredientId },
    });

    if (!ingredient) {
      throw new Error('Ingrediente no encontrado.');
    }

    return await prisma.$transaction(async (tx) => {
      // 1. Incrementar stock actual
      const updatedIngredient = await tx.ingredients.update({
        where: { id: dto.ingredientId },
        data: {
          current_stock: {
            increment: new Prisma.Decimal(dto.quantity),
          },
          updated_at: new Date(),
        },
      });

      // 2. Registrar transacción en stock_transactions
      await tx.stock_transactions.create({
        data: {
          ingredient_id: dto.ingredientId,
          transaction_type: 'restock',
          quantity: new Prisma.Decimal(dto.quantity),
          reference_type: 'purchase',
          notes: dto.notes || 'Ingreso manual de mercadería / compra',
          created_by: dto.userId || null,
        },
      });

      logger.info(
        { ingredientId: dto.ingredientId, quantity: dto.quantity, newStock: Number(updatedIngredient.current_stock) },
        'Reabastecimiento de ingrediente registrado exitosamente'
      );

      return {
        ...updatedIngredient,
        current_stock: Number(updatedIngredient.current_stock),
        min_stock: Number(updatedIngredient.min_stock),
        unit_cost: Number(updatedIngredient.unit_cost),
      };
    });
  }

  /**
   * Historial de movimientos de stock recientes
   */
  static async getTransactions(limit = 50) {
    const transactions = await prisma.stock_transactions.findMany({
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        ingredients: {
          select: { name: true, unit: true },
        },
        users: {
          select: { id: true, full_name: true, username: true },
        },
      },
    });

    return transactions.map((t) => ({
      id: t.id,
      ingredient_id: t.ingredient_id,
      ingredient_name: t.ingredients?.name,
      unit: t.ingredients?.unit,
      transaction_type: t.transaction_type,
      quantity: Number(t.quantity),
      reference_id: t.reference_id,
      reference_type: t.reference_type,
      notes: t.notes,
      created_by: t.users?.full_name || 'Sistema',
      created_at: t.created_at,
    }));
  }
}
