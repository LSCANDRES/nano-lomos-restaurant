import { Request, Response } from 'express';
import { WhatsAppService } from './whatsapp.service';
import { logger } from '../../lib/logger';

export class WhatsAppController {
  static async getStatus(_req: Request, res: Response): Promise<void> {
    try {
      const status = await WhatsAppService.getStatus();
      res.json(status);
    } catch (error: any) {
      logger.error({ error }, 'Error al consultar estado de WhatsApp');
      res.status(500).json({ error: error.message || 'Error al consultar WhatsApp' });
    }
  }

  static async getQR(req: Request, res: Response): Promise<void> {
    try {
      const phone = (req.query.phone as string) || '3804200387';
      const qrDataUrl = await WhatsAppService.generateQR(phone);
      res.json({ qrCodeDataUrl: qrDataUrl, targetNumber: phone });
    } catch (error: any) {
      logger.error({ error }, 'Error al generar código QR de WhatsApp');
      res.status(500).json({ error: error.message || 'Error al generar código QR' });
    }
  }

  static async confirmConnection(req: Request, res: Response): Promise<void> {
    try {
      const { phone } = req.body;
      const result = WhatsAppService.confirmConnection(phone);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al conectar' });
    }
  }

  static async disconnect(_req: Request, res: Response): Promise<void> {
    try {
      const result = await WhatsAppService.disconnect();
      res.json(result);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al desconectar' });
    }
  }

  static async getMessages(_req: Request, res: Response): Promise<void> {
    try {
      const messages = WhatsAppService.getMessages();
      res.json(messages);
    } catch (error: any) {
      res.status(500).json({ error: error.message || 'Error al obtener mensajes' });
    }
  }

  static async sendMessage(req: Request, res: Response): Promise<void> {
    try {
      const { phone, text } = req.body;
      if (!phone || !text) {
        res.status(400).json({ error: 'Teléfono y texto son requeridos' });
        return;
      }
      const result = WhatsAppService.sendMessage(phone, text);
      res.json(result);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al enviar mensaje' });
    }
  }

  static async simulateIncoming(req: Request, res: Response): Promise<void> {
    try {
      const { phone, senderName, text } = req.body;
      if (!text) {
        res.status(400).json({ error: 'El texto del mensaje es requerido' });
        return;
      }
      const message = WhatsAppService.receiveIncomingMessage({
        phone: phone || '3804200387',
        senderName: senderName || 'Andrés',
        text,
      });
      res.status(201).json(message);
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al simular mensaje' });
    }
  }

  static async markConverted(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { orderId } = req.body;
      const updated = WhatsAppService.markAsConverted(id, orderId ? Number(orderId) : undefined);
      res.json({ success: updated });
    } catch (error: any) {
      res.status(400).json({ error: error.message || 'Error al marcar mensaje' });
    }
  }
}
