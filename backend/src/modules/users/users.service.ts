import bcrypt from 'bcrypt';
import { prisma } from '../../lib/prisma';
import { logger } from '../../lib/logger';
import { config } from '../../config';

export interface CreateUserDto {
  username: string;
  email?: string;
  password: string;
  fullName: string;
  role: 'waiter' | 'order_taker' | 'cook' | 'manager' | 'admin';
}

export interface UpdateUserDto {
  fullName?: string;
  email?: string;
  role?: 'waiter' | 'order_taker' | 'cook' | 'manager' | 'admin';
  isActive?: boolean;
}

export class UsersService {
  /**
   * Listar todos los empleados/usuarios con soporte de filtro activo/inactivo
   */
  static async getAllUsers(includeInactive = true) {
    const where = includeInactive ? {} : { is_active: true };

    const users = await prisma.users.findMany({
      where,
      orderBy: { created_at: 'desc' },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        provider: true,
        avatar_url: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    return users;
  }

  /**
   * Obtener un empleado por ID
   */
  static async getUserById(id: number) {
    const user = await prisma.users.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        provider: true,
        avatar_url: true,
        is_active: true,
        last_login_at: true,
        created_at: true,
        updated_at: true,
      },
    });

    if (!user) {
      throw new Error('Empleado no encontrado');
    }

    return user;
  }

  /**
   * Crear un nuevo empleado (mozo, cocinero o gerente)
   */
  static async createUser(dto: CreateUserDto) {
    if (!dto.username || !dto.password || !dto.fullName || !dto.role) {
      throw new Error('Nombre de usuario, contraseña, nombre completo y rol son obligatorios.');
    }

    const existingUsername = await prisma.users.findUnique({
      where: { username: dto.username },
    });
    if (existingUsername) {
      throw new Error('El nombre de usuario ya está registrado.');
    }

    if (dto.email) {
      const existingEmail = await prisma.users.findFirst({
        where: { email: dto.email },
      });
      if (existingEmail) {
        throw new Error('El correo electrónico ya está en uso por otro empleado.');
      }
    }

    const passwordHash = await bcrypt.hash(dto.password, config.BCRYPT_ROUNDS);

    const newUser = await prisma.users.create({
      data: {
        username: dto.username.trim(),
        email: dto.email ? dto.email.trim().toLowerCase() : null,
        password_hash: passwordHash,
        full_name: dto.fullName.trim(),
        role: dto.role,
        provider: 'local',
        is_active: true,
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        provider: true,
        is_active: true,
        created_at: true,
      },
    });

    logger.info({ userId: newUser.id, username: newUser.username, role: newUser.role }, 'Nuevo empleado creado');
    return newUser;
  }

  /**
   * Modificar datos de un empleado (nombre, email, rol o estado activo)
   */
  static async updateUser(id: number, dto: UpdateUserDto) {
    const existing = await prisma.users.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Empleado no encontrado');
    }

    if (dto.email && dto.email !== existing.email) {
      const emailInUse = await prisma.users.findFirst({
        where: { email: dto.email, id: { not: id } },
      });
      if (emailInUse) {
        throw new Error('El correo electrónico ya está en uso por otro empleado.');
      }
    }

    const updated = await prisma.users.update({
      where: { id },
      data: {
        full_name: dto.fullName !== undefined ? dto.fullName.trim() : undefined,
        email: dto.email !== undefined ? dto.email.trim().toLowerCase() : undefined,
        role: dto.role !== undefined ? dto.role : undefined,
        is_active: dto.isActive !== undefined ? dto.isActive : undefined,
        updated_at: new Date(),
      },
      select: {
        id: true,
        username: true,
        email: true,
        full_name: true,
        role: true,
        is_active: true,
        updated_at: true,
      },
    });

    logger.info({ userId: id, changes: dto }, 'Datos de empleado actualizados');
    return updated;
  }

  /**
   * Resetear contraseña de un empleado
   */
  static async resetPassword(id: number, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new Error('La nueva contraseña debe tener al menos 6 caracteres.');
    }

    const existing = await prisma.users.findUnique({ where: { id } });
    if (!existing) {
      throw new Error('Empleado no encontrado');
    }

    const passwordHash = await bcrypt.hash(newPassword, config.BCRYPT_ROUNDS);

    await prisma.users.update({
      where: { id },
      data: {
        password_hash: passwordHash,
        updated_at: new Date(),
      },
    });

    logger.info({ userId: id }, 'Contraseña de empleado restablecida');
    return { message: 'Contraseña actualizada correctamente' };
  }

  /**
   * Alternar estado activo / suspendido
   */
  static async toggleStatus(id: number) {
    const user = await prisma.users.findUnique({ where: { id } });
    if (!user) throw new Error('Empleado no encontrado');

    const updated = await prisma.users.update({
      where: { id },
      data: {
        is_active: !user.is_active,
        updated_at: new Date(),
      },
      select: {
        id: true,
        username: true,
        is_active: true,
      },
    });

    logger.info({ userId: id, newStatus: updated.is_active }, 'Estado de empleado modificado');
    return updated;
  }

  /**
   * Historial de inicios de sesión de los empleados
   */
  static async getLoginHistory(userId?: number, limit = 50) {
    const where = userId ? { user_id: userId } : {};

    const history = await prisma.login_history.findMany({
      where,
      take: limit,
      orderBy: { created_at: 'desc' },
      include: {
        users: {
          select: { id: true, username: true, full_name: true, role: true },
        },
      },
    });

    return history.map((h) => ({
      id: h.id,
      user_id: h.user_id,
      username: h.users?.username,
      full_name: h.users?.full_name,
      role: h.users?.role,
      login_method: h.login_method,
      ip_address: h.ip_address,
      user_agent: h.user_agent,
      status: h.status,
      failure_reason: h.failure_reason,
      created_at: h.created_at,
    }));
  }
}
