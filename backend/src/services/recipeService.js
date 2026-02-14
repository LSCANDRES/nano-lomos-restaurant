const Recipe = require('../models/Recipe');
const logger = require('../utils/logger');

class RecipeService {
  static async getRecipeWithInstructions(menuItemId) {
    try {
      const recipe = await Recipe.getRecipeWithInstructions(menuItemId);
      
      if (!recipe) {
        throw new Error('Receta no encontrada para este item del menú');
      }
      
      return recipe;
    } catch (error) {
      logger.error('Error fetching recipe with instructions', { menuItemId, error: error.message });
      throw error;
    }
  }

  static async updateInstructions(menuItemId, instructions) {
    try {
      if (!instructions || instructions.trim() === '') {
        throw new Error('Las instrucciones no pueden estar vacías');
      }

      const recipes = await Recipe.updateInstructions(menuItemId, instructions);
      logger.info(`Instructions updated for menu item ${menuItemId}`);
      return recipes;
    } catch (error) {
      logger.error('Error updating instructions', { menuItemId, error: error.message });
      throw error;
    }
  }
}

module.exports = RecipeService;
