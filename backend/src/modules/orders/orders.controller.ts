import { Request, Response } from 'express';
import { OrdersService } from './orders.service';

export class OrdersController {
  static async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const {
        customerId,
        customerName,
        customerPhone,
        deliveryAddress,
        orderType,
        tableId,
        tableNumber,
        items,
        paymentMethod,
        paymentNotes,
      } = req.body;
      const createdBy = req.user!.id;

      const order = await OrdersService.createOrder({
        customerId,
        customerName,
        customerPhone,
        deliveryAddress,
        orderType,
        tableId: tableId ? Number(tableId) : undefined,
        tableNumber,
        items,
        createdBy,
        paymentMethod,
        paymentNotes,
      });

      res.status(201).json(order);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al crear pedido' });
    }
  }

  static async getOrders(req: Request, res: Response): Promise<void> {
    try {
      const status = req.query.status as string | undefined;
      const tableId = req.query.tableId ? Number(req.query.tableId) : undefined;

      const orders = await OrdersService.getAllOrders({ status, tableId });
      res.json(orders);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener pedidos' });
    }
  }

  static async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      if (isNaN(id)) {
        res.status(400).json({ error: 'ID de pedido inválido' });
        return;
      }

      const order = await OrdersService.getOrderById(id);
      res.json(order);
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Pedido no encontrado' });
    }
  }

  static async deliverOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await OrdersService.deliverOrder(id, req.user!.id);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al entregar pedido' });
    }
  }

  static async payOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { paymentMethod, notes } = req.body || {};
      const updated = await OrdersService.payOrder(id, req.user!.id, paymentMethod, notes);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al cobrar pedido' });
    }
  }

  static async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { reason } = req.body;

      if (!reason || reason.trim() === '') {
        res.status(400).json({ error: 'El motivo de cancelación es obligatorio' });
        return;
      }

      const updated = await OrdersService.cancelOrder(id, reason.trim(), req.user!.id, req.user!.role);
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al cancelar pedido' });
    }
  }

  static async assignCook(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { cookId } = req.body;
      if (!cookId) {
        res.status(400).json({ error: 'El ID del cocinero es obligatorio' });
        return;
      }

      const updated = await OrdersService.assignCook(id, Number(cookId));
      res.json(updated);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al asignar cocinero' });
    }
  }

  static async getAvailableCooks(_req: Request, res: Response): Promise<void> {
    try {
      const cooks = await OrdersService.getAvailableCooks();
      res.json(cooks);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener cocineros' });
    }
  }
}
