import { Request, Response } from 'express';
import { InventoryService } from './inventory.service';
import { logger } from '../../lib/logger';

export class InventoryController {
  static async getAllIngredients(_req: Request, res: Response): Promise<void> {
    try {
      const ingredients = await InventoryService.getAllIngredients();
      res.json(ingredients);
    } catch (error: any) {
      logger.error({ error }, 'Error al listar ingredientes');
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  static async restockIngredient(req: Request, res: Response): Promise<void> {
    try {
      const { ingredientId, quantity, notes } = req.body;

      if (!ingredientId || !quantity) {
        res.status(400).json({ error: 'ingredientId y quantity son requeridos' });
        return;
      }

      const userId = req.user?.id;
      const result = await InventoryService.restockIngredient({
        ingredientId: Number(ingredientId),
        quantity: Number(quantity),
        notes,
        userId,
      });

      res.status(200).json(result);
    } catch (error: any) {
      logger.error({ error }, 'Error al reabastecer ingrediente');
      res.status(400).json({ error: error.message || 'Error al procesar el ingreso de stock' });
    }
  }

  static async getTransactions(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const transactions = await InventoryService.getTransactions(limit);
      res.json(transactions);
    } catch (error: any) {
      logger.error({ error }, 'Error al obtener transacciones de stock');
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }
}
