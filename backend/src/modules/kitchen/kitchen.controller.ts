import { Request, Response } from 'express';
import { KitchenService } from './kitchen.service';

export class KitchenController {
  static async getQueue(_req: Request, res: Response): Promise<void> {
    try {
      const queue = await KitchenService.getQueue();
      res.json(queue);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener cola de cocina' });
    }
  }

  static async getMyOrders(req: Request, res: Response): Promise<void> {
    try {
      const orders = await KitchenService.getMyOrders(req.user!.id);
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener mis pedidos' });
    }
  }

  static async getReadyOrders(_req: Request, res: Response): Promise<void> {
    try {
      const orders = await KitchenService.getReadyOrders();
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener pedidos listos' });
    }
  }

  static async takeOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id, 10);
      const updated = await KitchenService.takeOrder(orderId, req.user!.id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al tomar pedido' });
    }
  }

  static async startOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id, 10);
      const updated = await KitchenService.startOrder(orderId, req.user!.id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al iniciar pedido' });
    }
  }

  static async completeOrder(req: Request, res: Response): Promise<void> {
    try {
      const orderId = parseInt(req.params.id, 10);
      const updated = await KitchenService.completeOrder(orderId, req.user!.id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al completar pedido' });
    }
  }

  static async getRecipe(req: Request, res: Response): Promise<void> {
    try {
      const menuItemId = parseInt(req.params.menuItemId, 10);
      const recipe = await KitchenService.getRecipeForDish(menuItemId);
      res.json(recipe);
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Receta no encontrada' });
    }
  }
}
