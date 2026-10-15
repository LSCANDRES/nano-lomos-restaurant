import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { prisma } from '../../lib/prisma';
import { config } from '../../config';
import { logger } from '../../lib/logger';
import { AuthUserPayload } from '../../middleware/requireAuth';

export interface LoginParams {
  usernameOrEmail: string;
  password: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface GoogleAuthParams {
  googleId: string;
  email: string;
  fullName?: string;
  avatarUrl?: string;
  ipAddress?: string;
  userAgent?: string;
}

export class AuthService {
  static generateTokens(user: { id: number; username: string; email: string | null; role: string; full_name: string }) {
    const payload: AuthUserPayload = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      fullName: user.full_name,
    };

    const accessToken = jwt.sign(payload, config.JWT_SECRET, {
      expiresIn: config.JWT_EXPIRES_IN as any,
    });

    const refreshToken = jwt.sign({ id: user.id }, config.JWT_REFRESH_SECRET, {
      expiresIn: config.JWT_REFRESH_EXPIRES_IN as any,
    });

    return { accessToken, refreshToken, user: payload };
  }

  static async loginWithPassword({ usernameOrEmail, password, ipAddress, userAgent }: LoginParams) {
    const user = await prisma.users.findFirst({
      where: {
        OR: [
          { username: usernameOrEmail.toLowerCase().trim() },
          { email: usernameOrEmail.toLowerCase().trim() },
        ],
      },
    });

    if (!user) {
      logger.warn({ usernameOrEmail }, 'Intento de login con usuario no existente');
      throw new Error('Credenciales inválidas.');
    }

    if (!user.is_active) {
      await this.recordLoginHistory({
        userId: user.id,
        email: user.email || user.username,
        method: 'local',
        ipAddress,
        userAgent,
        status: 'failed',
        failureReason: 'Usuario inactivo / deshabilitado',
      });
      throw new Error('Tu cuenta está desactivada. Consulta con el administrador.');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      await this.recordLoginHistory({
        userId: user.id,
        email: user.email || user.username,
        method: 'local',
        ipAddress,
        userAgent,
        status: 'failed',
        failureReason: 'Contraseña incorrecta',
      });
      throw new Error('Credenciales inválidas.');
    }

    // Actualizar último login
    await prisma.users.update({
      where: { id: user.id },
      data: { last_login_at: new Date() },
    });

    // Auditoría exitosa
    await this.recordLoginHistory({
      userId: user.id,
      email: user.email || user.username,
      method: 'local',
      ipAddress,
      userAgent,
      status: 'success',
    });

    return this.generateTokens(user);
  }

  static async verifyGoogleIdToken(idToken: string) {
    const response = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${encodeURIComponent(idToken)}`);
    if (!response.ok) {
      throw new Error('Token de Google inválido o expirado.');
    }

    interface GoogleTokenInfo {
      aud?: string;
      sub?: string;
      email?: string;
      email_verified?: string | boolean;
      name?: string;
      picture?: string;
    }
    const data = (await response.json()) as GoogleTokenInfo;

    // Validar audiencia si está configurada
    if (config.GOOGLE_CLIENT_ID && data.aud !== config.GOOGLE_CLIENT_ID) {
      throw new Error('El token de Google no corresponde a esta aplicación.');
    }

    if (data.email_verified !== 'true' && data.email_verified !== true) {
      throw new Error('La cuenta de Google debe tener el correo verificado.');
    }

    return {
      googleId: data.sub || '',
      email: (data.email || '').toLowerCase().trim(),
      fullName: data.name,
      avatarUrl: data.picture,
    };
  }

  static async loginWithGoogle({ googleId, email, fullName, avatarUrl, ipAddress, userAgent }: GoogleAuthParams) {
    const normalizedEmail = email.toLowerCase().trim();

    // 1. Buscar primero por google_id
    let user = await prisma.users.findUnique({
      where: { google_id: googleId },
    });

    // 2. Si no está vinculado aún, buscar por email existente
    if (!user) {
      user = await prisma.users.findUnique({
        where: { email: normalizedEmail },
      });

      if (user) {
        // Vincular cuenta existente con Google
        user = await prisma.users.update({
          where: { id: user.id },
          data: {
            google_id: googleId,
            provider: 'google',
            full_name: user.full_name || fullName || user.username,
            avatar_url: avatarUrl || user.avatar_url,
            is_email_verified: true,
            last_login_at: new Date(),
          },
        });
      }
    }

    // Si aún no existe usuario en la BD de restaurante:
    if (!user) {
      // Contar usuarios existentes para bootstrapping: si es el primer usuario o primer admin, asignarle rol 'manager'
      const totalUsers = await prisma.users.count();
      const defaultRole = totalUsers === 0 ? 'manager' : 'waiter';

      const baseUsername = normalizedEmail.split('@')[0].replace(/[^a-zA-Z0-9_]/g, '_').slice(0, 30);
      let usernameCandidate = baseUsername;
      const existingName = await prisma.users.findUnique({ where: { username: usernameCandidate } });
      if (existingName) {
        usernameCandidate = `${baseUsername}_${Math.floor(1000 + Math.random() * 9000)}`;
      }

      user = await prisma.users.create({
        data: {
          username: usernameCandidate,
          email: normalizedEmail,
          password_hash: '', // Usuario federado con Google
          full_name: fullName || usernameCandidate,
          role: defaultRole,
          provider: 'google',
          google_id: googleId,
          avatar_url: avatarUrl || null,
          is_email_verified: true,
          is_active: true,
          last_login_at: new Date(),
        },
      });

      logger.info(
        { userId: user.id, email: normalizedEmail, role: user.role },
        'Nuevo usuario creado automáticamente mediante Google OAuth'
      );
    }

    if (!user.is_active) {
      await this.recordLoginHistory({
        userId: user.id,
        email: normalizedEmail,
        method: 'google',
        ipAddress,
        userAgent,
        status: 'failed',
        failureReason: 'Usuario inactivo / deshabilitado',
      });
      throw new Error('Tu cuenta está desactivada. Consulta con el administrador.');
    }

    // Actualizar último login
    await prisma.users.update({
      where: { id: user.id },
      data: {
        last_login_at: new Date(),
        avatar_url: avatarUrl || user.avatar_url,
      },
    });

    await this.recordLoginHistory({
      userId: user.id,
      email: normalizedEmail,
      method: 'google',
      ipAddress,
      userAgent,
      status: 'success',
    });

    return this.generateTokens(user);
  }

  static async refreshToken(token: string) {
    try {
      const decoded = jwt.verify(token, config.JWT_REFRESH_SECRET) as { id: number };
      const user = await prisma.users.findUnique({
        where: { id: decoded.id },
      });

      if (!user || !user.is_active) {
        throw new Error('Usuario inválido o inactivo.');
      }

      return this.generateTokens(user);
    } catch {
      throw new Error('Refresh token inválido o expirado.');
    }
  }

  static async getCurrentUser(userId: number) {
    const user = await prisma.users.findUnique({
      where: { id: userId },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        avatar_url: true,
        provider: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
      },
    });

    if (!user) {
      throw new Error('Usuario no encontrado.');
    }

    return user;
  }

  private static async recordLoginHistory(params: {
    userId: number;
    email: string;
    method: 'local' | 'google';
    ipAddress?: string;
    userAgent?: string;
    status: 'success' | 'failed';
    failureReason?: string;
  }) {
    try {
      await prisma.login_history.create({
        data: {
          user_id: params.userId,
          email: params.email,
          login_method: params.method,
          ip_address: params.ipAddress || null,
          user_agent: params.userAgent || null,
          status: params.status,
          failure_reason: params.failureReason || null,
        },
      });
    } catch (err) {
      logger.error({ err }, 'Error al guardar registro en login_history');
    }
  }
}
