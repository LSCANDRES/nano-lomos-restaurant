const Ingredient = require('../models/Ingredient');
const pool = require('../database/connection');

/**
 * Inventory Service - Business logic for inventory management
 */
const inventoryService = {
  /**
   * Get all ingredients with stock status
   */
  async getIngredients() {
    const ingredients = await Ingredient.findAll();
    return ingredients.map(ing => ({
      ...ing,
      is_low_stock: parseFloat(ing.current_stock) < parseFloat(ing.min_stock)
    }));
  },

  /**
   * Get ingredients with low stock
   */
  async getLowStockIngredients() {
    return await Ingredient.findLowStock();
  },

  /**
   * Get a single ingredient by ID
   */
  async getIngredientById(id) {
    const ingredient = await Ingredient.findById(id);
    if (!ingredient) {
      throw new Error('Ingrediente no encontrado');
    }
    return ingredient;
  },

  /**
   * Create a new ingredient
   */
  async createIngredient(data) {
    const { name, unit, currentStock = 0, minStock = 0, unitCost = 0 } = data;
    
    if (!name || !unit) {
      throw new Error('Nombre y unidad son requeridos');
    }

    return await Ingredient.create({
      name,
      unit,
      currentStock: parseFloat(currentStock),
      minStock: parseFloat(minStock),
      unitCost: parseFloat(unitCost)
    });
  },

  /**
   * Update an ingredient
   */
  async updateIngredient(id, data) {
    const ingredient = await Ingredient.findById(id);
    if (!ingredient) {
      throw new Error('Ingrediente no encontrado');
    }

    const updates = {};
    if (data.name !== undefined) updates.name = data.name;
    if (data.unit !== undefined) updates.unit = data.unit;
    if (data.minStock !== undefined) updates.minStock = parseFloat(data.minStock);
    if (data.unitCost !== undefined) updates.unitCost = parseFloat(data.unitCost);

    return await Ingredient.update(id, updates);
  },

  /**
   * Delete an ingredient (if not used in recipes)
   */
  async deleteIngredient(id) {
    return await Ingredient.delete(id);
  },

  /**
   * Restock an ingredient (add stock)
   */
  async restockIngredient(ingredientId, quantity, userId, notes = '') {
    if (quantity <= 0) {
      throw new Error('La cantidad debe ser mayor a 0');
    }

    return await Ingredient.addStock(ingredientId, quantity, userId, notes);
  },

  /**
   * Generate purchase list (ingredients below min stock)
   */
  async generatePurchaseList() {
    const lowStock = await Ingredient.findLowStock();
    
    return lowStock.map(ing => {
      const deficit = parseFloat(ing.min_stock) - parseFloat(ing.current_stock);
      const suggestedQuantity = Math.max(deficit, parseFloat(ing.min_stock)); // Al menos comprar hasta min_stock
      const estimatedCost = suggestedQuantity * parseFloat(ing.unit_cost || 0);

      return {
        id: ing.id,
        name: ing.name,
        unit: ing.unit,
        current_stock: parseFloat(ing.current_stock),
        min_stock: parseFloat(ing.min_stock),
        deficit: deficit,
        suggested_quantity: Math.ceil(suggestedQuantity),
        unit_cost: parseFloat(ing.unit_cost || 0),
        estimated_cost: estimatedCost
      };
    });
  },

  /**
   * Get stock transactions history for an ingredient
   */
  async getStockHistory(ingredientId, limit = 20) {
    const query = `
      SELECT 
        st.*,
        u.full_name as created_by_name
      FROM stock_transactions st
      LEFT JOIN users u ON st.created_by = u.id
      WHERE st.ingredient_id = $1
      ORDER BY st.created_at DESC
      LIMIT $2
    `;
    
    const result = await pool.query(query, [ingredientId, limit]);
    return result.rows;
  },

  /**
   * Get inventory summary statistics
   */
  async getInventorySummary() {
    const query = `
      SELECT 
        COUNT(*) as total_ingredients,
        COUNT(*) FILTER (WHERE current_stock < min_stock) as low_stock_count,
        COUNT(*) FILTER (WHERE current_stock = 0) as out_of_stock_count,
        COALESCE(SUM(current_stock * unit_cost), 0) as total_inventory_value
      FROM ingredients
    `;
    
    const result = await pool.query(query);
    const summary = result.rows[0];

    return {
      total_ingredients: parseInt(summary.total_ingredients),
      low_stock_count: parseInt(summary.low_stock_count),
      out_of_stock_count: parseInt(summary.out_of_stock_count),
      total_inventory_value: parseFloat(summary.total_inventory_value)
    };
  }
};

module.exports = inventoryService;
