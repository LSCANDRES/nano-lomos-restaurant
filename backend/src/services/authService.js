const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const logger = require('../utils/logger');
const validator = require('../utils/validators');

const JWT_SECRET = process.env.JWT_SECRET || 'your_secret_key_here_change_in_production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30m';

class AuthService {
  static async login(username, password) {
    try {
      // Find user
      const user = await User.findByUsername(username);
      if (!user) {
        logger.warn(`Login attempt with invalid username: ${username}`);
        return { success: false, message: 'Credenciales inválidas' };
      }

      // Check if user is active
      if (!user.is_active) {
        logger.warn(`Login attempt for inactive user: ${username}`);
        return { success: false, message: 'Usuario inactivo' };
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        logger.warn(`Login attempt with invalid password for user: ${username}`);
        return { success: false, message: 'Credenciales inválidas' };
      }

      // Generate JWT token
      const token = jwt.sign(
        { 
          userId: user.id, 
          username: user.username, 
          role: user.role 
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      logger.info(`User logged in successfully: ${username} (${user.role})`);

      return {
        success: true,
        token,
        user: {
          id: user.id,
          username: user.username,
          fullName: user.full_name,
          role: user.role,
        },
      };
    } catch (error) {
      logger.error('Login error', { error: error.message });
      throw error;
    }
  }

  static verifyToken(token) {
    try {
      return jwt.verify(token, JWT_SECRET);
    } catch (error) {
      logger.warn('Invalid token verification attempt', { error: error.message });
      return null;
    }
  }

  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');
    return bcrypt.hash(password, saltRounds);
  }

  static async createUser({ username, password, fullName, role }) {
    // Validate inputs
    if (!username || !password || !fullName || !role) {
      throw new Error('Todos los campos son requeridos');
    }

    if (!validator.isValidPassword(password)) {
      throw new Error(`La contraseña debe tener al menos ${process.env.PASSWORD_MIN_LENGTH || 8} caracteres`);
    }

    if (!validator.isValidRole(role)) {
      throw new Error('Rol inválido');
    }

    // Check if username already exists
    const existingUser = await User.findByUsername(username);
    if (existingUser) {
      throw new Error('El nombre de usuario ya existe');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await User.create({
      username,
      passwordHash,
      fullName,
      role,
    });

    logger.info(`New user created: ${username} (${role})`);
    return user;
  }
}

module.exports = AuthService;
