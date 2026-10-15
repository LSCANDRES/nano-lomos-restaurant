import { Request, Response } from 'express';
import { UsersService } from './users.service';
import { logger } from '../../lib/logger';

export class UsersController {
  static async getAllUsers(req: Request, res: Response): Promise<void> {
    try {
      const includeInactive = req.query.includeInactive !== 'false';
      const users = await UsersService.getAllUsers(includeInactive);
      res.json(users);
    } catch (error: any) {
      logger.error({ error }, 'Error al listar empleados');
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }

  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const user = await UsersService.getUserById(id);
      res.json(user);
    } catch (error: any) {
      logger.error({ error }, 'Error al obtener empleado');
      res.status(404).json({ error: error.message || 'Empleado no encontrado' });
    }
  }

  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      const { username, email, password, fullName, role } = req.body;
      const user = await UsersService.createUser({
        username,
        email,
        password,
        fullName,
        role,
      });
      res.status(201).json(user);
    } catch (error: any) {
      logger.error({ error }, 'Error al crear empleado');
      res.status(400).json({ error: error.message || 'Error al crear empleado' });
    }
  }

  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { fullName, email, role, isActive } = req.body;
      const updated = await UsersService.updateUser(id, {
        fullName,
        email,
        role,
        isActive,
      });
      res.json(updated);
    } catch (error: any) {
      logger.error({ error }, 'Error al actualizar empleado');
      res.status(400).json({ error: error.message || 'Error al actualizar empleado' });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const { newPassword } = req.body;
      const result = await UsersService.resetPassword(id, newPassword);
      res.json(result);
    } catch (error: any) {
      logger.error({ error }, 'Error al restablecer contraseña de empleado');
      res.status(400).json({ error: error.message || 'Error al restablecer contraseña' });
    }
  }

  static async toggleStatus(req: Request, res: Response): Promise<void> {
    try {
      const id = parseInt(req.params.id, 10);
      const updated = await UsersService.toggleStatus(id);
      res.json(updated);
    } catch (error: any) {
      logger.error({ error }, 'Error al alternar estado de empleado');
      res.status(400).json({ error: error.message || 'Error al modificar estado' });
    }
  }

  static async getLoginHistory(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.query.userId ? parseInt(req.query.userId as string, 10) : undefined;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 50;
      const history = await UsersService.getLoginHistory(userId, limit);
      res.json(history);
    } catch (error: any) {
      logger.error({ error }, 'Error al obtener historial de inicio de sesión');
      res.status(500).json({ error: error.message || 'Error interno del servidor' });
    }
  }
}
