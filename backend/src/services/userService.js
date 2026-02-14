const User = require('../models/User');
const AuthService = require('./authService');
const logger = require('../utils/logger');

class UserService {
  /**
   * Get all users
   * @param {boolean} includeInactive - Include inactive users
   * @returns {Promise<Array>}
   */
  static async getAllUsers({ includeInactive = false } = {}) {
    try {
      const users = await User.findAll();
      if (!includeInactive) {
        return users.filter(u => u.is_active);
      }
      return users;
    } catch (error) {
      logger.error('Error fetching users', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  static async getUserById(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }
      return user;
    } catch (error) {
      logger.error('Error fetching user', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Get users by role
   * @param {string} role
   * @returns {Promise<Array>}
   */
  static async getUsersByRole(role) {
    try {
      const users = await User.findAll();
      return users.filter(u => u.role === role && u.is_active);
    } catch (error) {
      logger.error('Error fetching users by role', { role, error: error.message });
      throw error;
    }
  }

  /**
   * Create a new user
   * @param {object} userData
   * @returns {Promise<object>}
   */
  static async createUser({ username, password, fullName, role }) {
    try {
      const user = await AuthService.createUser({ username, password, fullName, role });
      logger.info(`User created via UserService: ${username}`);
      return user;
    } catch (error) {
      logger.error('Error creating user', { username, error: error.message });
      throw error;
    }
  }

  /**
   * Update user details (excluding password)
   * @param {number} id
   * @param {object} updates
   * @returns {Promise<object>}
   */
  static async updateUser(id, { fullName, role, isActive }) {
    try {
      const existingUser = await User.findById(id);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      const user = await User.update(id, { fullName, role, isActive });
      logger.info(`User updated: ${id}`, { fullName, role, isActive });
      return user;
    } catch (error) {
      logger.error('Error updating user', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Change user password
   * @param {number} id
   * @param {string} newPassword
   * @returns {Promise<boolean>}
   */
  static async changePassword(id, newPassword) {
    try {
      const existingUser = await User.findById(id);
      if (!existingUser) {
        throw new Error('Usuario no encontrado');
      }

      const passwordHash = await AuthService.hashPassword(newPassword);
      
      // Update password directly in database
      const db = require('../database/connection');
      await db.query(
        'UPDATE users SET password_hash = $1 WHERE id = $2',
        [passwordHash, id]
      );
      
      logger.info(`Password changed for user: ${id}`);
      return true;
    } catch (error) {
      logger.error('Error changing password', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Toggle user active status
   * @param {number} id
   * @returns {Promise<object>}
   */
  static async toggleUserStatus(id) {
    try {
      const user = await User.findById(id);
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const updated = await User.update(id, { isActive: !user.is_active });
      logger.info(`User status toggled: ${id} -> ${updated.is_active}`);
      return updated;
    } catch (error) {
      logger.error('Error toggling user status', { id, error: error.message });
      throw error;
    }
  }

  /**
   * Get available cooks (for order assignment)
   * @returns {Promise<Array>}
   */
  static async getAvailableCooks() {
    try {
      return await this.getUsersByRole('cook');
    } catch (error) {
      logger.error('Error fetching available cooks', { error: error.message });
      throw error;
    }
  }
}

module.exports = UserService;
