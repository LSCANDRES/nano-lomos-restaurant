const bcrypt = require('bcrypt');
const db = require('../connection');
const logger = require('../../utils/logger');

async function seedUsers() {
  logger.info('Seeding users...');

  const users = [
    {
      username: 'admin',
      password: 'admin123',
      full_name: 'Administrador Sistema',
      role: 'manager',
    },
    {
      username: 'cocinero1',
      password: 'cocina123',
      full_name: 'María García',
      role: 'cook',
    },
    {
      username: 'cocinero2',
      password: 'cocina123',
      full_name: 'Carlos Rodríguez',
      role: 'cook',
    },
    {
      username: 'pedidos1',
      password: 'pedidos123',
      full_name: 'Ana Martínez',
      role: 'order_taker',
    },
    {
      username: 'pedidos2',
      password: 'pedidos123',
      full_name: 'Luis Fernández',
      role: 'order_taker',
    },
  ];

  const saltRounds = parseInt(process.env.BCRYPT_ROUNDS || '10');

  for (const user of users) {
    try {
      const passwordHash = await bcrypt.hash(user.password, saltRounds);

      await db.query(
        `INSERT INTO users (username, password_hash, full_name, role, is_active)
         VALUES ($1, $2, $3, $4, true)
         ON CONFLICT (username) DO NOTHING`,
        [user.username, passwordHash, user.full_name, user.role]
      );

      logger.info(`✅ User created: ${user.username} (${user.role})`);
    } catch (error) {
      logger.error(`❌ Failed to create user: ${user.username}`, { error: error.message });
    }
  }

  logger.info('Users seeding completed');
}

module.exports = seedUsers;
