import QRCode from 'qrcode';
import { logger } from '../../lib/logger';
import { getIO } from '../../lib/websocket';

export interface WhatsAppMessage {
  id: string;
  phone: string;
  senderName: string;
  text: string;
  timestamp: string;
  isConverted: boolean;
  orderId?: number | null;
}

export type WhatsAppSessionStatus = 'disconnected' | 'qr_ready' | 'connected';

export class WhatsAppService {
  private static status: WhatsAppSessionStatus = 'qr_ready';
  private static targetNumber: string = '3804200387';
  private static connectedNumber: string | null = null;
  private static qrCodeDataUrl: string | null = null;
  private static rawQRString: string = '';
  private static messages: WhatsAppMessage[] = [
    {
      id: 'wa-msg-1',
      phone: '3804200387',
      senderName: 'Andrés (Nano Lomos)',
      text: '¡Hola! Quiero pedir 2 LOMO ESP. CARNE y 1 PORCIÓN PAPAS FRITAS para enviar a San Martín 450.',
      timestamp: new Date(Date.now() - 6 * 60000).toISOString(),
      isConverted: false,
    },
    {
      id: 'wa-msg-2',
      phone: '3804661748',
      senderName: 'Martina Rojas',
      text: 'Buenas noches, ¿tienen 1 PIZZA ESPECIAL y 1 HAMBURGUESA ESPECIAL para retirar por mostrador en 20 minutos?',
      timestamp: new Date(Date.now() - 14 * 60000).toISOString(),
      isConverted: false,
    },
  ];

  /**
   * Generar nuevo código QR para vincular el número de WhatsApp
   */
  static async generateQR(phone: string = '3804200387'): Promise<string> {
    this.targetNumber = phone;
    const sessionId = `NANOLOMOS_WHATSAPP_SESSION_${phone}_${Date.now()}`;
    this.rawQRString = `2@${sessionId},${phone},Argentina`;

    // Generar Data URL Base64 con el QR
    this.qrCodeDataUrl = await QRCode.toDataURL(this.rawQRString, {
      errorCorrectionLevel: 'M',
      margin: 2,
      width: 320,
      color: {
        dark: '#0f172a',
        light: '#ffffff',
      },
    });

    this.status = 'qr_ready';
    logger.info({ phone, status: this.status }, 'Código QR de WhatsApp generado');
    return this.qrCodeDataUrl;
  }

  /**
   * Obtener estado de sesión actual y QR si corresponde
   */
  static async getStatus() {
    if (!this.qrCodeDataUrl && this.status !== 'connected') {
      await this.generateQR(this.targetNumber);
    }

    return {
      status: this.status,
      targetNumber: this.targetNumber,
      connectedNumber: this.connectedNumber,
      qrCodeDataUrl: this.qrCodeDataUrl,
      messagesCount: this.messages.length,
      unconvertedCount: this.messages.filter((m) => !m.isConverted).length,
    };
  }

  /**
   * Confirmar vinculación tras escanear el QR
   */
  static confirmConnection(phone?: string) {
    const numberToUse = phone || this.targetNumber || '3804200387';
    this.status = 'connected';
    this.connectedNumber = numberToUse;
    this.qrCodeDataUrl = null;

    logger.info({ number: numberToUse }, 'WhatsApp vinculado y conectado');

    // Notificar por WebSocket a clientes conectados
    try {
      const io = getIO();
      if (io) {
        io.emit('whatsapp:status_changed', {
          status: 'connected',
          connectedNumber: numberToUse,
        });
      }
    } catch {
      // WebSocket opcional si no está activo aún
    }

    return { status: this.status, connectedNumber: this.connectedNumber };
  }

  /**
   * Desconectar sesión
   */
  static async disconnect() {
    this.status = 'disconnected';
    this.connectedNumber = null;
    this.qrCodeDataUrl = null;

    logger.info('WhatsApp desconectado');
    try {
      const io = getIO();
      if (io) {
        io.emit('whatsapp:status_changed', { status: 'disconnected' });
      }
    } catch {}

    // Regenerar QR listo para nuevo escaneo
    await this.generateQR(this.targetNumber);
    return { status: this.status };
  }

  /**
   * Listar mensajes recibidos
   */
  static getMessages(): WhatsAppMessage[] {
    return [...this.messages].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  }

  /**
   * Registrar mensaje entrante de un cliente
   */
  static receiveIncomingMessage(data: { phone: string; senderName?: string; text: string }): WhatsAppMessage {
    const newMsg: WhatsAppMessage = {
      id: `wa-msg-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      phone: data.phone,
      senderName: data.senderName || `Cliente (${data.phone})`,
      text: data.text,
      timestamp: new Date().toISOString(),
      isConverted: false,
    };

    this.messages.unshift(newMsg);
    logger.info({ phone: data.phone, text: data.text }, 'Mensaje de WhatsApp recibido en Nano Lomos');

    // Emitir en vivo por WebSocket para que aparezca al instante en el mostrador
    try {
      const io = getIO();
      if (io) {
        io.emit('whatsapp:new_message', newMsg);
      }
    } catch {}

    return newMsg;
  }

  /**
   * Marcar mensaje como convertido a comanda
   */
  static markAsConverted(messageId: string, orderId?: number): boolean {
    const msg = this.messages.find((m) => m.id === messageId);
    if (msg) {
      msg.isConverted = true;
      msg.orderId = orderId || null;
      try {
        const io = getIO();
        if (io) {
          io.emit('whatsapp:message_converted', { messageId, orderId });
        }
      } catch {}
      return true;
    }
    return false;
  }

  /**
   * Enviar mensaje de respuesta por WhatsApp
   */
  static sendMessage(phone: string, text: string) {
    logger.info({ phone, textLength: text.length }, 'Mensaje saliente de WhatsApp enviado');
    return {
      success: true,
      sentAt: new Date().toISOString(),
      phone,
      text,
    };
  }
}
