const db = require('../database/connection');

class MenuItem {
  static async findAll({ includeInactive = false } = {}) {
    const query = includeInactive
      ? 'SELECT * FROM menu_items ORDER BY category, name'
      : 'SELECT * FROM menu_items WHERE is_active = true ORDER BY category, name';
    
    const result = await db.query(query);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM menu_items WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findByCategory(category) {
    const result = await db.query(
      'SELECT * FROM menu_items WHERE category = $1 AND is_active = true ORDER BY name',
      [category]
    );
    return result.rows;
  }

  static async findWithRecipes(menuItemId) {
    const result = await db.query(
      `SELECT 
        mi.*,
        json_agg(json_build_object(
          'ingredient_id', r.ingredient_id,
          'ingredient_name', i.name,
          'quantity_required', r.quantity_required,
          'unit', i.unit,
          'instructions', r.instructions
        )) FILTER (WHERE r.id IS NOT NULL) as recipe
       FROM menu_items mi
       LEFT JOIN recipes r ON r.menu_item_id = mi.id
       LEFT JOIN ingredients i ON i.id = r.ingredient_id
       WHERE mi.id = $1
       GROUP BY mi.id`,
      [menuItemId]
    );
    return result.rows[0];
  }

  static async create({ name, description, price, category }) {
    const result = await db.query(
      `INSERT INTO menu_items (name, description, price, category, is_active)
       VALUES ($1, $2, $3, $4, true)
       RETURNING *`,
      [name, description, price, category]
    );
    return result.rows[0];
  }

  static async update(id, { name, description, price, category, isActive }) {
    const updates = [];
    const values = [];
    let paramIndex = 1;

    if (name !== undefined) {
      updates.push(`name = $${paramIndex++}`);
      values.push(name);
    }
    if (description !== undefined) {
      updates.push(`description = $${paramIndex++}`);
      values.push(description);
    }
    if (price !== undefined) {
      updates.push(`price = $${paramIndex++}`);
      values.push(price);
    }
    if (category !== undefined) {
      updates.push(`category = $${paramIndex++}`);
      values.push(category);
    }
    if (isActive !== undefined) {
      updates.push(`is_active = $${paramIndex++}`);
      values.push(isActive);
    }

    values.push(id);

    const result = await db.query(
      `UPDATE menu_items SET ${updates.join(', ')} 
       WHERE id = $${paramIndex}
       RETURNING *`,
      values
    );
    return result.rows[0];
  }

  static async checkAvailability(menuItemId) {
    // Check if menu item has sufficient ingredients in stock
    const result = await db.query(
      `SELECT 
        i.id as ingredient_id,
        i.name as ingredient_name,
        i.current_stock,
        i.unit,
        r.quantity_required
       FROM recipes r
       JOIN ingredients i ON i.id = r.ingredient_id
       WHERE r.menu_item_id = $1 AND i.current_stock < r.quantity_required`,
      [menuItemId]
    );
    
    if (result.rows.length > 0) {
      return {
        available: false,
        missingIngredients: result.rows,
      };
    }

    return { available: true };
  }
}

module.exports = MenuItem;
