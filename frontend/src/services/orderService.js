import api from './api';

const orderService = {
  /**
   * Get all orders (filtered by role)
   * @param {object} filters - { status, assignedCookId }
   * @returns {Promise<Array>}
   */
  async getOrders(filters = {}) {
    const response = await api.get('/orders', { params: filters });
    return response.data;
  },

  /**
   * Get pending orders
   * @returns {Promise<Array>}
   */
  async getPendingOrders() {
    const response = await api.get('/orders/pending');
    return response.data;
  },

  /**
   * Get order by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  async getOrderById(id) {
    const response = await api.get(`/orders/${id}`);
    return response.data;
  },

  /**
   * Create new order
   * @param {object} orderData - { tableNumber, customerId, items: [{menuItemId, quantity, notes}] }
   * @returns {Promise<object>}
   */
  async createOrder(orderData) {
    const response = await api.post('/orders', orderData);
    return response.data;
  },

  /**
   * Update order status
   * @param {number} id
   * @param {string} status - 'pending', 'assigned', 'in_progress', 'completed'
   * @returns {Promise<object>}
   */
  async updateOrderStatus(id, status) {
    const response = await api.put(`/orders/${id}/status`, { status });
    return response.data;
  },

  /**
   * Manually assign order to cook (FR-006A)
   * @param {number} orderId
   * @param {number} cookId
   * @returns {Promise<object>}
   */
  async assignOrderToCook(orderId, cookId) {
    const response = await api.put(`/orders/${orderId}/assign`, { cookId });
    return response.data;
  },

  /**
   * Auto-assign next order (FIFO) - for cooks
   * @returns {Promise<object>}
   */
  async autoAssignNextOrder() {
    const response = await api.post('/orders/auto-assign');
    return response.data;
  },
};

export default orderService;
