import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { config } from '../config';
import { logger } from '../lib/logger';

export interface AuthUserPayload {
  id: number;
  username: string;
  email: string | null;
  role: string;
  fullName: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUserPayload;
    }
  }
}

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  try {
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7);
    } else if (req.cookies && (req.cookies.accessToken || req.cookies.token || req.cookies.jwt)) {
      token = req.cookies.accessToken || req.cookies.token || req.cookies.jwt;
    }

    if (!token) {
      res.status(401).json({ error: 'No autorizado. Token no proporcionado.' });
      return;
    }

    const decoded = jwt.verify(token, config.JWT_SECRET) as AuthUserPayload;
    req.user = decoded;
    next();
  } catch (error) {
    logger.warn({ error }, 'Error al verificar token de autenticación');
    res.status(401).json({ error: 'Token inválido o expirado.' });
  }
}
