import api from './api';

/**
 * Inventory Service - API client for inventory management
 */
const inventoryService = {
  /**
   * Get all ingredients with stock status
   */
  async getIngredients() {
    const response = await api.get('/inventory');
    return response.data;
  },

  /**
   * Get inventory summary statistics
   */
  async getSummary() {
    const response = await api.get('/inventory/summary');
    return response.data;
  },

  /**
   * Get ingredients with low stock
   */
  async getLowStock() {
    const response = await api.get('/inventory/low-stock');
    return response.data;
  },

  /**
   * Get purchase list for low stock items
   */
  async getPurchaseList() {
    const response = await api.get('/inventory/purchase-list');
    return response.data;
  },

  /**
   * Get a single ingredient by ID
   */
  async getIngredient(id) {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },

  /**
   * Get stock history for an ingredient
   */
  async getStockHistory(id, limit = 20) {
    const response = await api.get(`/inventory/${id}/history`, {
      params: { limit }
    });
    return response.data;
  },

  /**
   * Create a new ingredient
   */
  async createIngredient(data) {
    const response = await api.post('/inventory', data);
    return response.data;
  },

  /**
   * Update an ingredient
   */
  async updateIngredient(id, data) {
    const response = await api.put(`/inventory/${id}`, data);
    return response.data;
  },

  /**
   * Restock an ingredient
   */
  async restockIngredient(id, quantity, notes = '') {
    const response = await api.post(`/inventory/${id}/restock`, {
      quantity,
      notes
    });
    return response.data;
  },

  /**
   * Delete an ingredient
   */
  async deleteIngredient(id) {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  }
};

export default inventoryService;
