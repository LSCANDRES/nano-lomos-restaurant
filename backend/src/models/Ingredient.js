const db = require('../database/connection');

class Ingredient {
  static async findAll() {
    const result = await db.query(
      'SELECT * FROM ingredients ORDER BY name'
    );
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM ingredients WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findLowStock() {
    const result = await db.query(
      `SELECT * FROM ingredients 
       WHERE current_stock < min_stock 
       ORDER BY (current_stock / NULLIF(min_stock, 0)) ASC`
    );
    return result.rows;
  }

  static async create({ name, unit, currentStock, minStock, unitCost }) {
    const result = await db.query(
      `INSERT INTO ingredients (name, unit, current_stock, min_stock, unit_cost)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [name, unit, currentStock, minStock, unitCost]
    );
    return result.rows[0];
  }

  static async update(id, { name, unit, currentStock, minStock, unitCost }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (unit !== undefined) {
      updates.push(`unit = $${paramIndex++}`);
      values.push(unit);
    }
    if (currentStock !== undefined) {
      updates.push(`current_stock = $${paramIndex++}`);
      values.push(currentStock);
    }
    if (minStock !== undefined) {
      updates.push(`min_stock = $${paramIndex++}`);
      values.push(minStock);
    }
    if (unitCost !== undefined) {
      updates.push(`unit_cost = $${paramIndex++}`);
      values.push(unitCost);
    }

    values.push(id);

    const result = await db.query(
      `UPDATE ingredients SET ${updates.join(', ')}
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async delete(id) {
    // Check if ingredient is used in any recipes
    const usageCheck = await db.query(
      'SELECT COUNT(*) as count FROM recipes WHERE ingredient_id = $1',
      [id]
    );

    if (parseInt(usageCheck.rows[0].count) > 0) {
      throw new Error('No se puede eliminar: ingrediente usado en recetas existentes');
    }

    const result = await db.query(
      'DELETE FROM ingredients WHERE id = $1 RETURNING *',
      [id]
    );
    return result.rows[0];
  }

  static async addStock(id, quantity, userId, notes = '') {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Update stock
      await client.query(
        'UPDATE ingredients SET current_stock = current_stock + $1 WHERE id = $2',
        [quantity, id]
      );

      // Record transaction
      await client.query(
        `INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity, created_by, notes)
         VALUES ($1, 'purchase', $2, $3, $4)`,
        [id, quantity, userId, notes]
      );

      await client.query('COMMIT');

      return await Ingredient.findById(id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

module.exports = Ingredient;
