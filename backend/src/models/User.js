const db = require('../database/connection');

class User {
  static async findById(id) {
    const result = await db.query(
      'SELECT id, username, full_name, role, is_active, created_at FROM users WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByUsername(username) {
    const result = await db.query(
      'SELECT * FROM users WHERE username = $1',
      [username]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await db.query(
      'SELECT id, username, full_name, role, is_active, created_at FROM users ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async create({ username, passwordHash, fullName, role }) {
    const result = await db.query(
      `INSERT INTO users (username, password_hash, full_name, role, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING id, username, full_name, role, is_active, created_at`,
      [username, passwordHash, fullName, role]
    );
    return result.rows[0];
  }

  static async update(id, { fullName, role, isActive }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (fullName !== undefined) {
      updates.push(`full_name = $${paramIndex++}`);
      values.push(fullName);
    }
    if (role !== undefined) {
      updates.push(`role = $${paramIndex++}`);
      values.push(role);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING id, username, full_name, role, is_active, created_at`,
      values
    );
    return result.rows[0];
  }
}

module.exports = User;
