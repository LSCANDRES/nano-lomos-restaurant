import api from './api';

const recipeService = {
  /**
   * Obtener receta con ingredientes e instrucciones
   */
  getRecipeWithInstructions: async (menuItemId) => {
    const response = await api.get(`/recipes/${menuItemId}`);
    return response.data;
  },

  /**
   * Actualizar instrucciones de una receta (solo managers)
   */
  updateInstructions: async (menuItemId, instructions) => {
    const response = await api.put(`/recipes/${menuItemId}/instructions`, { instructions });
    return response.data;
  },
};

export default recipeService;
