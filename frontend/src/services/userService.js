import api from './api';

const userService = {
  /**
   * Get all users
   * @param {boolean} includeInactive - Include inactive users
   * @returns {Promise<Array>}
   */
  async getUsers(includeInactive = false) {
    const response = await api.get('/users', {
      params: { includeInactive }
    });
    return response.data;
  },

  /**
   * Get user by ID
   * @param {number} id
   * @returns {Promise<object>}
   */
  async getUserById(id) {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },

  /**
   * Get users by role
   * @param {string} role
   * @returns {Promise<Array>}
   */
  async getUsersByRole(role) {
    const response = await api.get(`/users/role/${role}`);
    return response.data;
  },

  /**
   * Get available cooks
   * @returns {Promise<Array>}
   */
  async getCooks() {
    const response = await api.get('/users/cooks');
    return response.data;
  },

  /**
   * Create new user (manager only)
   * @param {object} userData
   * @returns {Promise<object>}
   */
  async createUser(userData) {
    const response = await api.post('/users', userData);
    return response.data;
  },

  /**
   * Update user (manager only)
   * @param {number} id
   * @param {object} updates
   * @returns {Promise<object>}
   */
  async updateUser(id, updates) {
    const response = await api.put(`/users/${id}`, updates);
    return response.data;
  },

  /**
   * Change user password (manager only)
   * @param {number} id
   * @param {string} password
   * @returns {Promise<object>}
   */
  async changePassword(id, password) {
    const response = await api.put(`/users/${id}/password`, { password });
    return response.data;
  },

  /**
   * Toggle user active status (manager only)
   * @param {number} id
   * @returns {Promise<object>}
   */
  async toggleUserStatus(id) {
    const response = await api.put(`/users/${id}/toggle-status`);
    return response.data;
  }
};

export default userService;
