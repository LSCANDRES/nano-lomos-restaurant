const pool = require('../database/connection');

/**
 * Report Service - Provides aggregated statistics for manager dashboard
 */
const reportService = {
  /**
   * Get daily statistics for a specific date
   * @param {string} date - Date in YYYY-MM-DD format (defaults to today)
   */
  async getDailyStats(date = null) {
    const targetDate = date || new Date().toISOString().split('T')[0];
    
    const query = `
      SELECT 
        COUNT(*) FILTER (WHERE DATE(created_at) = $1) as total_orders,
        COUNT(*) FILTER (WHERE status = 'pending' AND DATE(created_at) = $1) as pending_orders,
        COUNT(*) FILTER (WHERE status = 'assigned' AND DATE(created_at) = $1) as assigned_orders,
        COUNT(*) FILTER (WHERE status = 'in_progress' AND DATE(created_at) = $1) as in_progress_orders,
        COUNT(*) FILTER (WHERE status = 'completed' AND DATE(created_at) = $1) as completed_orders,
        COALESCE(SUM(total_amount) FILTER (WHERE DATE(created_at) = $1), 0) as total_revenue,
        COALESCE(AVG(EXTRACT(EPOCH FROM (completed_at - created_at))/60) FILTER (WHERE status = 'completed' AND DATE(created_at) = $1), 0) as avg_completion_time_minutes
      FROM orders
    `;
    
    const result = await pool.query(query, [targetDate]);
    const stats = result.rows[0];
    
    return {
      date: targetDate,
      total_orders: parseInt(stats.total_orders) || 0,
      pending_orders: parseInt(stats.pending_orders) || 0,
      assigned_orders: parseInt(stats.assigned_orders) || 0,
      in_progress_orders: parseInt(stats.in_progress_orders) || 0,
      completed_orders: parseInt(stats.completed_orders) || 0,
      total_revenue: parseFloat(stats.total_revenue) || 0,
      avg_completion_time_minutes: Math.round(parseFloat(stats.avg_completion_time_minutes) || 0)
    };
  },

  /**
   * Get orders count grouped by status (real-time)
   */
  async getOrdersByStatus() {
    const query = `
      SELECT 
        status,
        COUNT(*) as count
      FROM orders
      WHERE DATE(created_at) = CURRENT_DATE
      GROUP BY status
    `;
    
    const result = await pool.query(query);
    
    // Initialize counts
    const statusCounts = {
      pending: 0,
      assigned: 0,
      in_progress: 0,
      completed: 0
    };
    
    // Fill from query results
    result.rows.forEach(row => {
      if (statusCounts.hasOwnProperty(row.status)) {
        statusCounts[row.status] = parseInt(row.count);
      }
    });
    
    return statusCounts;
  },

  /**
   * Get current cook assignments
   */
  async getCookAssignments() {
    const query = `
      SELECT 
        u.id as cook_id,
        u.full_name as cook_name,
        COUNT(o.id) FILTER (WHERE o.status IN ('assigned', 'in_progress')) as active_orders,
        COUNT(o.id) FILTER (WHERE o.status = 'completed' AND DATE(o.completed_at) = CURRENT_DATE) as completed_today
      FROM users u
      LEFT JOIN orders o ON u.id = o.assigned_cook_id
      WHERE u.role = 'cook'
      GROUP BY u.id, u.full_name
      ORDER BY u.full_name
    `;
    
    const result = await pool.query(query);
    return result.rows.map(row => ({
      cook_id: row.cook_id,
      cook_name: row.cook_name,
      active_orders: parseInt(row.active_orders) || 0,
      completed_today: parseInt(row.completed_today) || 0
    }));
  },

  /**
   * Get revenue report for a date range
   * @param {string} fromDate - Start date YYYY-MM-DD
   * @param {string} toDate - End date YYYY-MM-DD
   */
  async getRevenueReport(fromDate, toDate) {
    const query = `
      SELECT 
        DATE(created_at) as date,
        COUNT(*) as orders_count,
        SUM(total_amount) as revenue
      FROM orders
      WHERE DATE(created_at) BETWEEN $1 AND $2
        AND status = 'completed'
      GROUP BY DATE(created_at)
      ORDER BY date DESC
    `;
    
    const result = await pool.query(query, [fromDate, toDate]);
    
    return {
      from_date: fromDate,
      to_date: toDate,
      daily_data: result.rows.map(row => ({
        date: row.date,
        orders_count: parseInt(row.orders_count),
        revenue: parseFloat(row.revenue)
      })),
      total_revenue: result.rows.reduce((sum, row) => sum + parseFloat(row.revenue), 0),
      total_orders: result.rows.reduce((sum, row) => sum + parseInt(row.orders_count), 0)
    };
  },

  /**
   * Get top selling menu items
   * @param {number} limit - Number of items to return
   */
  async getTopSellingItems(limit = 5) {
    const query = `
      SELECT 
        mi.id,
        mi.name,
        mi.category,
        COUNT(ol.id) as times_ordered,
        SUM(ol.quantity) as total_quantity,
        SUM(ol.quantity * ol.unit_price) as total_revenue
      FROM menu_items mi
      JOIN order_lines ol ON mi.id = ol.menu_item_id
      JOIN orders o ON ol.order_id = o.id
      WHERE DATE(o.created_at) = CURRENT_DATE
      GROUP BY mi.id, mi.name, mi.category
      ORDER BY total_quantity DESC
      LIMIT $1
    `;
    
    const result = await pool.query(query, [limit]);
    return result.rows.map(row => ({
      id: row.id,
      name: row.name,
      category: row.category,
      times_ordered: parseInt(row.times_ordered),
      total_quantity: parseInt(row.total_quantity),
      total_revenue: parseFloat(row.total_revenue)
    }));
  }
};

module.exports = reportService;
