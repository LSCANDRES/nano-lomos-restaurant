import { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { logger } from '../../lib/logger';
import { config } from '../../config';

export class AuthController {
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, usernameOrEmail, password } = req.body;
      const targetUser = usernameOrEmail || username || email;

      if (!targetUser || !password) {
        res.status(400).json({ error: 'Debes ingresar usuario/email y contraseña.' });
        return;
      }

      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.loginWithPassword({
        usernameOrEmail: targetUser,
        password,
        ipAddress,
        userAgent,
      });

      // Establecer cookies seguras para navegador
      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000, // 15 mins
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
      });

      res.json(result);
    } catch (error: any) {
      logger.warn({ err: error.message }, 'Fallo de inicio de sesión');
      res.status(401).json({ error: error.message || 'Credenciales inválidas.' });
    }
  }

  static async googleLogin(req: Request, res: Response): Promise<void> {
    try {
      const { idToken } = req.body;

      if (!idToken) {
        res.status(400).json({ error: 'Falta el idToken de Google.' });
        return;
      }

      const verified = await AuthService.verifyGoogleIdToken(idToken);
      const ipAddress = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress;
      const userAgent = req.headers['user-agent'];

      const result = await AuthService.loginWithGoogle({
        googleId: verified.googleId,
        email: verified.email,
        fullName: verified.fullName,
        avatarUrl: verified.avatarUrl,
        ipAddress,
        userAgent,
      });

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.cookie('refreshToken', result.refreshToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 30 * 24 * 60 * 60 * 1000,
      });

      res.json(result);
    } catch (error: any) {
      logger.warn({ err: error.message }, 'Fallo en autenticación con Google');
      res.status(401).json({ error: error.message || 'Error al autenticar con Google.' });
    }
  }

  static async me(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: 'No autorizado' });
        return;
      }

      const user = await AuthService.getCurrentUser(req.user.id);
      res.json({ user });
    } catch (error: any) {
      res.status(404).json({ error: error.message || 'Usuario no encontrado.' });
    }
  }

  static async refresh(req: Request, res: Response): Promise<void> {
    try {
      const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;

      if (!refreshToken) {
        res.status(400).json({ error: 'Refresh token no proporcionado.' });
        return;
      }

      const result = await AuthService.refreshToken(refreshToken);

      res.cookie('accessToken', result.accessToken, {
        httpOnly: true,
        secure: config.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 15 * 60 * 1000,
      });

      res.json(result);
    } catch (error: any) {
      res.status(401).json({ error: error.message || 'Token inválido.' });
    }
  }

  static async logout(_req: Request, res: Response): Promise<void> {
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    res.json({ message: 'Sesión cerrada correctamente.' });
  }
}
