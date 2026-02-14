const MenuItem = require('../models/MenuItem');
const logger = require('../utils/logger');

class MenuService {
  static async getAllMenuItems({ includeInactive = false } = {}) {
    try {
      return await MenuItem.findAll({ includeInactive });
    } catch (error) {
      logger.error('Error fetching menu items', { error: error.message });
      throw error;
    }
  }

  static async getMenuItemById(id) {
    try {
      const menuItem = await MenuItem.findById(id);
      if (!menuItem) {
        throw new Error('Item de menú no encontrado');
      }
      return menuItem;
    } catch (error) {
      logger.error('Error fetching menu item', { id, error: error.message });
      throw error;
    }
  }

  static async getMenuItemWithRecipe(id) {
    try {
      const menuItem = await MenuItem.findWithRecipes(id);
      if (!menuItem) {
        throw new Error('Item de menú no encontrado');
      }
      return menuItem;
    } catch (error) {
      logger.error('Error fetching menu item with recipe', { id, error: error.message });
      throw error;
    }
  }

  static async createMenuItem({ name, description, price, category }) {
    try {
      if (!name || !price) {
        throw new Error('Nombre y precio son requeridos');
      }

      if (price <= 0) {
        throw new Error('El precio debe ser mayor a 0');
      }

      const menuItem = await MenuItem.create({ name, description, price, category });
      logger.info(`Menu item created: ${name}`, { id: menuItem.id });
      return menuItem;
    } catch (error) {
      logger.error('Error creating menu item', { error: error.message });
      throw error;
    }
  }

  static async updateMenuItem(id, updates) {
    try {
      const menuItem = await MenuItem.update(id, updates);
      if (!menuItem) {
        throw new Error('Item de menú no encontrado');
      }
      logger.info(`Menu item updated: ${id}`);
      return menuItem;
    } catch (error) {
      logger.error('Error updating menu item', { id, error: error.message });
      throw error;
    }
  }

  static async updateMenuItemImage(id, imageUrl) {
    try {
      const menuItem = await MenuItem.update(id, { image_url: imageUrl });
      if (!menuItem) {
        throw new Error('Item de menú no encontrado');
      }
      logger.info(`Menu item image updated: ${id}`, { imageUrl });
      return menuItem;
    } catch (error) {
      logger.error('Error updating menu item image', { id, error: error.message });
      throw error;
    }
  }

  static async checkMenuItemAvailability(menuItemId) {
    try {
      return await MenuItem.checkAvailability(menuItemId);
    } catch (error) {
      logger.error('Error checking menu item availability', { menuItemId, error: error.message });
      throw error;
    }
  }
}

module.exports = MenuService;
