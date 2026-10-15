import { Request, Response } from 'express';
import { MenuService } from './menu.service';

export class MenuController {
  static async getMenu(req: Request, res: Response): Promise<void> {
    try {
      const category = req.query.category as string | undefined;
      const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'manager';
      const items = await MenuService.getAllMenuItems({ category, includeInactive });
      res.json(items);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener menú' });
    }
  }

  static async getMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de plato inválido' });
        return;
      }
      const item = await MenuService.getMenuItemById(id);
      res.json(item);
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Plato no encontrado' });
    }
  }

  static async getMenuItemAvailability(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de plato inválido' });
        return;
      }
      const availability = await MenuService.checkMenuItemAvailability(id);
      res.json(availability);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al consultar disponibilidad' });
    }
  }

  static async createMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const { name, description, price, category, image_url } = req.body;
      const created = await MenuService.createMenuItem({
        name,
        description,
        price: Number(price),
        category,
        image_url,
      });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al crear plato' });
    }
  }

  static async updateMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de plato inválido' });
        return;
      }

      const updated = await MenuService.updateMenuItem(id, {
        ...req.body,
        price: req.body.price !== undefined ? Number(req.body.price) : undefined,
      });
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al actualizar plato' });
    }
  }

  static async deleteMenuItem(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de plato inválido' });
        return;
      }

      await MenuService.deleteMenuItem(id);
      res.json({ message: 'Plato desactivado correctamente' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al eliminar plato' });
    }
  }
}
