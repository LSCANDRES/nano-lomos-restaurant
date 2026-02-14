const db = require('../connection');
const logger = require('../../utils/logger');

async function seedIngredients() {
  logger.info('Seeding ingredients...');

  const ingredients = [
    // CARNES
    { name: 'Carne de res (lomo)', unit: 'kg', current_stock: 50, min_stock: 10, unit_cost: 8000 },
    { name: 'Pechuga de pollo', unit: 'kg', current_stock: 40, min_stock: 8, unit_cost: 4500 },
    { name: 'Carne molida', unit: 'kg', current_stock: 30, min_stock: 8, unit_cost: 5500 },
    
    // PANES
    { name: 'Pan de lomo', unit: 'unidades', current_stock: 100, min_stock: 20, unit_cost: 500 },
    { name: 'Pan de hamburguesa', unit: 'unidades', current_stock: 120, min_stock: 25, unit_cost: 300 },
    { name: 'Masa de pizza', unit: 'unidades', current_stock: 80, min_stock: 15, unit_cost: 600 },
    
    // QUESOS
    { name: 'Queso muzzarella', unit: 'kg', current_stock: 25, min_stock: 5, unit_cost: 4000 },
    { name: 'Queso cheddar', unit: 'kg', current_stock: 15, min_stock: 3, unit_cost: 4500 },
    { name: 'Queso roquefort', unit: 'kg', current_stock: 10, min_stock: 2, unit_cost: 6000 },
    
    // VEGETALES
    { name: 'Lechuga', unit: 'kg', current_stock: 20, min_stock: 5, unit_cost: 1200 },
    { name: 'Tomate', unit: 'kg', current_stock: 30, min_stock: 8, unit_cost: 1500 },
    { name: 'Cebolla', unit: 'kg', current_stock: 15, min_stock: 5, unit_cost: 800 },
    { name: 'Morrón', unit: 'kg', current_stock: 10, min_stock: 3, unit_cost: 1800 },
    { name: 'Choclo', unit: 'kg', current_stock: 12, min_stock: 3, unit_cost: 2000 },
    
    // FIAMBRES
    { name: 'Jamón', unit: 'kg', current_stock: 15, min_stock: 4, unit_cost: 3500 },
    { name: 'Panceta', unit: 'kg', current_stock: 20, min_stock: 5, unit_cost: 4000 },
    { name: 'Longaniza calabresa', unit: 'kg', current_stock: 18, min_stock: 4, unit_cost: 3800 },
    
    // OTROS
    { name: 'Huevos', unit: 'unidades', current_stock: 200, min_stock: 50, unit_cost: 150 },
    { name: 'Mayonesa', unit: 'l', current_stock: 8, min_stock: 2, unit_cost: 2500 },
    
    // PAPAS Y ACEITE
    { name: 'Papas', unit: 'kg', current_stock: 100, min_stock: 20, unit_cost: 800 },
    { name: 'Aceite', unit: 'l', current_stock: 30, min_stock: 8, unit_cost: 1500 },
    
    // CONDIMENTOS Y SALSAS
    { name: 'Salsa de tomate', unit: 'l', current_stock: 15, min_stock: 4, unit_cost: 2000 },
    { name: 'Aceitunas', unit: 'kg', current_stock: 10, min_stock: 2, unit_cost: 3000 },
    { name: 'Ajo', unit: 'kg', current_stock: 5, min_stock: 1, unit_cost: 2500 },
    { name: 'Albahaca', unit: 'g', current_stock: 500, min_stock: 100, unit_cost: 20 },
    { name: 'Sal', unit: 'kg', current_stock: 10, min_stock: 2, unit_cost: 500 },
    { name: 'Pimienta', unit: 'kg', current_stock: 3, min_stock: 1, unit_cost: 8000 },
  ];

  for (const ingredient of ingredients) {
    try {
      await db.query(
        `INSERT INTO ingredients (name, unit, current_stock, min_stock, unit_cost)
         VALUES ($1, $2, $3, $4, $5)`,
        [ingredient.name, ingredient.unit, ingredient.current_stock, ingredient.min_stock, ingredient.unit_cost]
      );

      logger.info(`✅ Ingredient created: ${ingredient.name}`);
    } catch (error) {
      logger.error(`❌ Failed to create ingredient: ${ingredient.name}`, { error: error.message });
    }
  }

  logger.info('Ingredients seeding completed');
}

module.exports = seedIngredients;
