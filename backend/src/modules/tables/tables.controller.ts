import { Request, Response } from 'express';
import { TablesService } from './tables.service';

export class TablesController {
  static async getTables(req: Request, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive === 'true' && req.user?.role === 'manager';
      const tables = await TablesService.getAllTables(includeInactive);
      res.json(tables);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener mesas' });
    }
  }

  static async getTableById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de mesa inválido' });
        return;
      }
      const table = await TablesService.getTableById(id);
      res.json(table);
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Mesa no encontrada' });
    }
  }

  static async createTable(req: Request, res: Response): Promise<void> {
    try {
      const { number, name, capacity, position_x, position_y } = req.body;
      const created = await TablesService.createTable({
        number,
        name,
        capacity: capacity ? Number(capacity) : undefined,
        position_x: position_x ? Number(position_x) : undefined,
        position_y: position_y ? Number(position_y) : undefined,
      });
      res.status(201).json(created);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al crear mesa' });
    }
  }

  static async updateTable(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de mesa inválido' });
        return;
      }

      const updated = await TablesService.updateTable(id, req.body);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al actualizar mesa' });
    }
  }

  static async deleteTable(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de mesa inválido' });
        return;
      }

      await TablesService.deleteTable(id);
      res.json({ message: 'Mesa desactivada con éxito' });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al eliminar mesa' });
    }
  }
}
