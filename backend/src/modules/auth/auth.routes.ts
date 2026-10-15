import { Router } from 'express';
import { AuthController } from './auth.controller';
import { requireAuth } from '../../middleware/requireAuth';

const router = Router();

// Rutas públicas
router.post('/login', AuthController.login);
router.post('/google', AuthController.googleLogin);
router.post('/refresh', AuthController.refresh);
router.post('/logout', AuthController.logout);

// Rutas protegidas
router.get('/me', requireAuth, AuthController.me);

export const authRouter = router;
