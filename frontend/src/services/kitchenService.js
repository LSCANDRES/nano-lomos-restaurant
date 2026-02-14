import api from './api';

const kitchenService = {
  /**
   * Obtener el pedido actualmente asignado al cocinero
   */
  getAssignedOrder: async () => {
    const response = await api.get('/kitchen/assigned');
    return response.data;
  },

  /**
   * Solicitar el siguiente pedido (auto-asignación FIFO)
   */
  requestOrder: async () => {
    const response = await api.post('/kitchen/request-order');
    return response.data;
  },

  /**
   * Actualizar el estado de un pedido
   */
  updateOrderStatus: async (orderId, status) => {
    const response = await api.put(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  /**
   * Obtener estadísticas del cocinero
   */
  getStats: async (date = null) => {
    const params = date ? { date } : {};
    const response = await api.get('/kitchen/stats', { params });
    return response.data;
  },
};

export default kitchenService;
