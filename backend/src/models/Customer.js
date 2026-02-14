const db = require('../database/connection');

class Customer {
  static async findById(id) {
    const result = await db.query(
      'SELECT * FROM customers WHERE id = $1',
      [id]
    );
    return result.rows[0];
  }

  static async findAll() {
    const result = await db.query(
      'SELECT * FROM customers ORDER BY created_at DESC'
    );
    return result.rows;
  }

  static async create({ firstName, lastName, phone, email }) {
    const result = await db.query(
      `INSERT INTO customers (first_name, last_name, phone, email)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [firstName, lastName, phone, email]
    );
    return result.rows[0];
  }

  static async getOrderHistory(customerId) {
    const result = await db.query(
      `SELECT o.*, 
              COUNT(ol.id) as items_count,
              json_agg(json_build_object(
                'menu_item_id', ol.menu_item_id,
                'quantity', ol.quantity,
                'unit_price', ol.unit_price
              )) as items
       FROM orders o
       LEFT JOIN order_lines ol ON ol.order_id = o.id
       WHERE o.customer_id = $1
       GROUP BY o.id
       ORDER BY o.created_at DESC`,
      [customerId]
    );
    return result.rows;
  }

  static async getTotalSpent(customerId) {
    const result = await db.query(
      `SELECT COALESCE(SUM(total_amount), 0) as total_spent
       FROM orders
       WHERE customer_id = $1 AND status = 'completed'`,
      [customerId]
    );
    return parseFloat(result.rows[0].total_spent);
  }
}

module.exports = Customer;
