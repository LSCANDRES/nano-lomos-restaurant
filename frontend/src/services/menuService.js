import api from './api';

const menuService = {
  /**
   * Get all menu items
   * @param {boolean} includeInactive - Include inactive items (manager only)
   * @returns {Promise<Array>}
   */
  async getMenu(includeInactive = false) {
    const response = await api.get('/menu', {
      params: { includeInactive },
    });
    return response.data;
  },

  /**
   * Get menu item by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  async getMenuItem(id) {
    const response = await api.get(`/menu/${id}`);
    return response.data;
  },

  /**
   * Get menu item with recipe and ingredients
   * @param {number} id
   * @returns {Promise<object>}
   */
  async getMenuItemRecipe(id) {
    const response = await api.get(`/menu/${id}/recipe`);
    return response.data;
  },

  /**
   * Check ingredient availability for menu item
   * @param {number} id
   * @returns {Promise<{available: boolean, missing: Array}>}
   */
  async checkAvailability(id) {
    const response = await api.get(`/menu/${id}/availability`);
    return response.data;
  },

  /**
   * Create new menu item (manager only)
   * @param {object} menuItem
   * @returns {Promise<object>}
   */
  async createMenuItem(menuItem) {
    const response = await api.post('/menu', menuItem);
    return response.data;
  },

  /**
   * Update menu item (manager only)
   * @param {number} id
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateMenuItem(id, updates) {
    const response = await api.put(`/menu/${id}`, updates);
    return response.data;
  },
};

export default menuService;
