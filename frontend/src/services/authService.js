import api from './api';

const authService = {
  /**
   * Login user with username and password
   * @param {string} username
   * @param {string} password
   * @returns {Promise<{token: string, user: object}>}
   */
  async login(username, password) {
    const response = await api.post('/auth/login', { username, password });
    const { token, user } = response.data;

    // Store token and user info in localStorage
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));

    return { token, user };
  },

  /**
   * Get current authenticated user
   * @returns {Promise<object>}
   */
  async getMe() {
    const response = await api.get('/auth/me');
    const user = response.data;

    // Update user info in localStorage
    localStorage.setItem('user', JSON.stringify(user));

    return user;
  },

  /**
   * Logout user (clear local storage)
   */
  logout() {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  /**
   * Get stored token
   * @returns {string|null}
   */
  getToken() {
    return localStorage.getItem('token');
  },

  /**
   * Get stored user info
   * @returns {object|null}
   */
  getUser() {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  },

  /**
   * Check if user is authenticated
   * @returns {boolean}
   */
  isAuthenticated() {
    return !!this.getToken();
  },
};

export default authService;
