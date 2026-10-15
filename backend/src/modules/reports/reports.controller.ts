import { Request, Response } from 'express';
import { ReportsService } from './reports.service';
import { logger } from '../../lib/logger';

export class ReportsController {
  static async getDailyStats(req: Request, res: Response): Promise<void> {
    try {
      const date = req.query.date as string | undefined;
      const stats = await ReportsService.getDailyStats(date);
      res.json(stats);
    } catch (error: any) {
      logger.error({ error }, 'Error al obtener estadísticas diarias');
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  static async getTopItems(req: Request, res: Response): Promise<void> {
    try {
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 5;
      const topItems = await ReportsService.getTopItems(limit);
      res.json(topItems);
    } catch (error: any) {
      logger.error({ error }, 'Error al obtener platos más vendidos');
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  static async getPurchaseProjection(_req: Request, res: Response): Promise<void> {
    try {
      const projection = await ReportsService.getPurchaseProjection();
      res.json(projection);
    } catch (error: any) {
      logger.error({ error }, 'Error al obtener proyección de compras');
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  static async getCashShift(req: Request, res: Response): Promise<void> {
    try {
      const initialCash = req.query.initialCash ? parseFloat(req.query.initialCash as string) : 0;
      const date = req.query.date as string | undefined;
      const summary = await ReportsService.getCashShiftSummary(initialCash, date);
      res.json(summary);
    } catch (error: any) {
      logger.error({ error }, 'Error al generar arqueo de caja');
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }
}
