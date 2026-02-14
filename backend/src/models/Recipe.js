const db = require('../database/connection');
const logger = require('../utils/logger');

class Recipe {
  static async findByMenuItemId(menuItemId) {
    try {
      const query = `
        SELECT 
          r.id,
          r.menu_item_id,
          r.ingredient_id,
          r.quantity_required,
          r.instructions,
          i.name as ingredient_name,
          i.unit,
          i.current_stock,
          m.name as menu_item_name
        FROM recipes r
        JOIN ingredients i ON r.ingredient_id = i.id
        LEFT JOIN menu_items m ON r.menu_item_id = m.id
        WHERE r.menu_item_id = $1
        ORDER BY r.id
      `;
      
      const result = await db.query(query, [menuItemId]);
      return result.rows;
    } catch (error) {
      logger.error('Error fetching recipes', { menuItemId, error: error.message });
      throw error;
    }
  }

  static async getRecipeWithInstructions(menuItemId) {
    try {
      const recipes = await this.findByMenuItemId(menuItemId);
      
      if (recipes.length === 0) {
        return null;
      }

      // Agrupar por menu_item_id y combinar ingredientes
      return {
        menu_item_id: recipes[0].menu_item_id,
        menu_item_name: recipes[0].menu_item_name,
        instructions: recipes[0].instructions,
        ingredients: recipes.map(r => ({
          id: r.ingredient_id,
          name: r.ingredient_name,
          quantity_required: r.quantity_required,
          unit: r.unit,
          current_stock: r.current_stock,
        })),
      };
    } catch (error) {
      logger.error('Error getting recipe with instructions', { menuItemId, error: error.message });
      throw error;
    }
  }

  static async updateInstructions(menuItemId, instructions) {
    try {
      const query = `
        UPDATE recipes
        SET 
          instructions = $1,
          updated_at = CURRENT_TIMESTAMP
        WHERE menu_item_id = $2
        RETURNING *
      `;
      
      const result = await db.query(query, [instructions, menuItemId]);
      
      if (result.rows.length === 0) {
        throw new Error('Receta no encontrada');
      }
      
      logger.info(`Recipe instructions updated for menu item ${menuItemId}`);
      return result.rows;
    } catch (error) {
      logger.error('Error updating recipe instructions', { menuItemId, error: error.message });
      throw error;
    }
  }
}

module.exports = Recipe;
