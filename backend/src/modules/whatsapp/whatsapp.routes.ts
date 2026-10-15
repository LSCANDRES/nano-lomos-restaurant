import { Router } from 'express';
import { WhatsAppController } from './whatsapp.controller';
import { requireAuth } from '../../middleware/requireAuth';
import { requireRole } from '../../middleware/requireRole';

const router = Router();

// Todas las operaciones de WhatsApp requieren sesión activa de Mostrador, Mozo, Gerente o Admin
router.use(requireAuth);
router.use(requireRole('order_taker', 'waiter', 'manager', 'admin'));

router.get('/status', WhatsAppController.getStatus);
router.get('/qr', WhatsAppController.getQR);
router.post('/connect', WhatsAppController.confirmConnection);
router.post('/disconnect', WhatsAppController.disconnect);
router.get('/messages', WhatsAppController.getMessages);
router.post('/send', WhatsAppController.sendMessage);
router.post('/simulate-incoming', WhatsAppController.simulateIncoming);
router.patch('/messages/:id/converted', WhatsAppController.markConverted);

export const whatsappRouter = router;
