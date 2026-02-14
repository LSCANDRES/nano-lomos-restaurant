const db = require('../database/connection');

class Order {
  static async findAll({ status, assignedCookId, limit = 100 } = {}) {
    let query = `
      SELECT o.*, 
             u_created.full_name as created_by_name,
             u_cook.full_name as cook_name,
             c.first_name || ' ' || c.last_name as customer_name,
             json_agg(json_build_object(
               'id', ol.id,
               'menu_item_id', ol.menu_item_id,
               'menu_item_name', mi.name,
               'quantity', ol.quantity,
               'unit_price', ol.unit_price,
               'notes', ol.notes
             )) as items
      FROM orders o
      LEFT JOIN users u_created ON u_created.id = o.created_by
      LEFT JOIN users u_cook ON u_cook.id = o.assigned_cook_id
      LEFT JOIN customers c ON c.id = o.customer_id
      LEFT JOIN order_lines ol ON ol.order_id = o.id
      LEFT JOIN menu_items mi ON mi.id = ol.menu_item_id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND o.status = $${paramIndex++}`;
      params.push(status);
    }

    if (assignedCookId) {
      query += ` AND o.assigned_cook_id = $${paramIndex++}`;
      params.push(assignedCookId);
    }

    query += ` GROUP BY o.id, u_created.full_name, u_cook.full_name, customer_name`;
    query += ` ORDER BY o.created_at DESC LIMIT $${paramIndex}`;
    params.push(limit);

    const result = await db.query(query, params);
    return result.rows;
  }

  static async findById(id) {
    const result = await db.query(
      `SELECT o.*, 
              u_created.full_name as created_by_name,
              u_cook.full_name as cook_name,
              c.first_name || ' ' || c.last_name as customer_name,
              json_agg(json_build_object(
                'id', ol.id,
                'menu_item_id', ol.menu_item_id,
                'menu_item_name', mi.name,
                'quantity', ol.quantity,
                'unit_price', ol.unit_price,
                'notes', ol.notes
              )) as items
       FROM orders o
       LEFT JOIN users u_created ON u_created.id = o.created_by
       LEFT JOIN users u_cook ON u_cook.id = o.assigned_cook_id
       LEFT JOIN customers c ON c.id = o.customer_id
       LEFT JOIN order_lines ol ON ol.order_id = o.id
       LEFT JOIN menu_items mi ON mi.id = ol.menu_item_id
       WHERE o.id = $1
       GROUP BY o.id, u_created.full_name, u_cook.full_name, customer_name`,
      [id]
    );
    return result.rows[0];
  }

  static async create({ customerId, tableNumber, createdBy, items }) {
    const client = await db.pool.connect();
    
    try {
      await client.query('BEGIN');

      // Create order
      const orderResult = await client.query(
        `INSERT INTO orders (customer_id, table_number, status, created_by)
         VALUES ($1, $2, 'pending', $3)
         RETURNING *`,
        [customerId, tableNumber, createdBy]
      );
      
      const order = orderResult.rows[0];

      // Create order lines
      for (const item of items) {
        await client.query(
          `INSERT INTO order_lines (order_id, menu_item_id, quantity, unit_price, notes)
           VALUES ($1, $2, $3, $4, $5)`,
          [order.id, item.menuItemId, item.quantity, item.unitPrice, item.notes]
        );
      }

      await client.query('COMMIT');
      
      // Fetch complete order with items
      return await Order.findById(order.id);
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  static async updateStatus(id, status, options = {}) {
    const { assignedCookId, timestamp } = options;
    const updates = ['status = $1'];
    const params = [status, id];
    let paramIndex = 3;

    if (status === 'assigned' && timestamp) {
      updates.push(`assigned_at = $${paramIndex++}`);
      params.splice(2, 0, timestamp);
    }
    if (status === 'in_progress' && timestamp) {
      updates.push(`started_at = $${paramIndex++}`);
      params.splice(2, 0, timestamp);
    }
    if (status === 'completed' && timestamp) {
      updates.push(`completed_at = $${paramIndex++}`);
      params.splice(2, 0, timestamp);
    }
    if (assignedCookId !== undefined) {
      updates.push(`assigned_cook_id = $${paramIndex++}`);
      params.splice(2, 0, assignedCookId);
    }

    const result = await db.query(
      `UPDATE orders SET ${updates.join(', ')}
       WHERE id = $2
       RETURNING *`,
      params
    );
    return result.rows[0];
  }

  static async assignToCook(orderId, cookId) {
    const result = await db.query(
      `UPDATE orders 
       SET status = 'assigned', assigned_cook_id = $1, assigned_at = CURRENT_TIMESTAMP
       WHERE id = $2 AND status = 'pending'
       RETURNING *`,
      [cookId, orderId]
    );
    return result.rows[0];
  }

  static async getPendingOrders() {
    return await Order.findAll({ status: 'pending' });
  }

  static async getOldestPending() {
    const result = await db.query(
      `SELECT * FROM orders 
       WHERE status = 'pending' 
       ORDER BY created_at ASC 
       LIMIT 1`
    );
    return result.rows[0];
  }
}

module.exports = Order;
