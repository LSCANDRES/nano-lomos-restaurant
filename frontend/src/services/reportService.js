import api from './api';

/**
 * Report Service - API client for manager reports
 */
const reportService = {
  /**
   * Get daily statistics
   * @param {string} date - Optional date in YYYY-MM-DD format
   */
  async getDailyStats(date = null) {
    const params = date ? { date } : {};
    const response = await api.get('/reports/daily', { params });
    return response.data;
  },

  /**
   * Get current order counts by status
   */
  async getOrdersByStatus() {
    const response = await api.get('/reports/status');
    return response.data;
  },

  /**
   * Get current cook assignments
   */
  async getCookAssignments() {
    const response = await api.get('/reports/assignments');
    return response.data;
  },

  /**
   * Get revenue report for date range
   * @param {string} fromDate - Start date YYYY-MM-DD
   * @param {string} toDate - End date YYYY-MM-DD
   */
  async getRevenueReport(fromDate, toDate) {
    const response = await api.get('/reports/revenue', {
      params: { from: fromDate, to: toDate }
    });
    return response.data;
  },

  /**
   * Get top selling menu items
   * @param {number} limit - Number of items to return
   */
  async getTopSellingItems(limit = 5) {
    const response = await api.get('/reports/top-items', {
      params: { limit }
    });
    return response.data;
  }
};

export default reportService;
