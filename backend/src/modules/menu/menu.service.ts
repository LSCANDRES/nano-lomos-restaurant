import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { Prisma } from '@prisma/client';

export interface CreateMenuItemDto {
  name: string;
  description?: string;
  price: number;
  category?: string;
  image_url?: string;
}

export interface UpdateMenuItemDto {
  name?: string;
  description?: string;
  price?: number;
  category?: string;
  image_url?: string;
  is_active?: boolean;
}

export class MenuService {
  static async getAllMenuItems(params: { category?: string; includeInactive?: boolean } = {}) {
    const { category, includeInactive = false } = params;

    const where: Prisma.menu_itemsWhereInput = {};
    if (!includeInactive) {
      where.is_active = true;
    }
    if (category) {
      where.category = category;
    }

    const items = await prisma.menu_items.findMany({
      where,
      orderBy: [{ category: 'asc' }, { name: 'asc' }],
      include: {
        recipes: {
          select: {
            ingredient_id: true,
            quantity_required: true,
            ingredients: {
              select: {
                name: true,
                unit: true,
                current_stock: true,
              },
            },
          },
        },
      },
    });

    return items.map((item) => {
      // Determinar si hay stock suficiente según sus recetas
      let isAvailable = true;
      const missingIngredients: Array<{ name: string; required: number; current: number; unit: string }> = [];

      for (const r of item.recipes) {
        const current = Number(r.ingredients?.current_stock || 0);
        const required = Number(r.quantity_required);
        if (current < required) {
          isAvailable = false;
          missingIngredients.push({
            name: r.ingredients?.name || 'Ingrediente',
            required,
            current,
            unit: r.ingredients?.unit || 'u',
          });
        }
      }

      return {
        id: item.id,
        name: item.name,
        description: item.description,
        price: Number(item.price),
        category: item.category || 'General',
        image_url: item.image_url,
        is_active: item.is_active,
        recipeCount: item.recipes.length,
        isAvailable,
        missingIngredients,
      };
    });
  }

  static async getMenuItemById(id: number) {
    const item = await prisma.menu_items.findUnique({
      where: { id },
      include: {
        recipes: {
          include: {
            ingredients: true,
          },
        },
      },
    });

    if (!item) {
      throw new Error('Plato de menú no encontrado');
    }

    return {
      ...item,
      price: Number(item.price),
      recipes: item.recipes.map((r) => ({
        id: r.id,
        ingredientId: r.ingredient_id,
        ingredientName: r.ingredients.name,
        unit: r.ingredients.unit,
        currentStock: Number(r.ingredients.current_stock || 0),
        quantityRequired: Number(r.quantity_required),
        instructions: r.instructions,
      })),
    };
  }

  static async checkMenuItemAvailability(id: number) {
    const item = await this.getMenuItemById(id);

    const missingIngredients = item.recipes
      .filter((r) => r.currentStock < r.quantityRequired)
      .map((r) => ({
        ingredientId: r.ingredientId,
        name: r.ingredientName,
        currentStock: r.currentStock,
        quantityRequired: r.quantityRequired,
        unit: r.unit,
      }));

    return {
      menuItemId: id,
      name: item.name,
      available: missingIngredients.length === 0,
      missingIngredients,
    };
  }

  static async createMenuItem(data: CreateMenuItemDto) {
    if (!data.name || data.name.trim() === '') {
      throw new Error('El nombre del plato es obligatorio');
    }
    if (data.price === undefined || data.price <= 0) {
      throw new Error('El precio debe ser un número positivo');
    }

    const created = await prisma.menu_items.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim() || null,
        price: new Prisma.Decimal(data.price),
        category: data.category?.trim() || 'General',
        image_url: data.image_url || null,
        is_active: true,
      },
    });

    logger.info({ menuItemId: created.id, name: created.name }, 'Plato de menú creado');
    return { ...created, price: Number(created.price) };
  }

  static async updateMenuItem(id: number, data: UpdateMenuItemDto) {
    const item = await prisma.menu_items.findUnique({ where: { id } });
    if (!item) {
      throw new Error('Plato de menú no encontrado');
    }

    const updated = await prisma.menu_items.update({
      where: { id },
      data: {
        ...(data.name !== undefined && { name: data.name.trim() }),
        ...(data.description !== undefined && { description: data.description.trim() }),
        ...(data.price !== undefined && { price: new Prisma.Decimal(data.price) }),
        ...(data.category !== undefined && { category: data.category.trim() }),
        ...(data.image_url !== undefined && { image_url: data.image_url }),
        ...(data.is_active !== undefined && { is_active: data.is_active }),
      },
    });

    logger.info({ menuItemId: id }, 'Plato de menú actualizado');
    return { ...updated, price: Number(updated.price) };
  }

  static async deleteMenuItem(id: number) {
    const item = await prisma.menu_items.findUnique({ where: { id } });
    if (!item) {
      throw new Error('Plato de menú no encontrado');
    }

    const updated = await prisma.menu_items.update({
      where: { id },
      data: { is_active: false },
    });

    logger.info({ menuItemId: id }, 'Plato de menú desactivado');
    return { ...updated, price: Number(updated.price) };
  }
}
