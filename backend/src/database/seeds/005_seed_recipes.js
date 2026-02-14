const db = require('../connection');
const logger = require('../../utils/logger');

async function seedRecipes() {
  logger.info('Seeding recipes...');

  // Get menu items and ingredients IDs
  const menuItemsResult = await db.query('SELECT id, name FROM menu_items');
  const ingredientsResult = await db.query('SELECT id, name FROM ingredients');

  const menuItems = Object.fromEntries(menuItemsResult.rows.map((i) => [i.name, i.id]));
  const ingredients = Object.fromEntries(ingredientsResult.rows.map((i) => [i.name, i.id]));

  const recipes = [
    // LOMO ESPECIAL DE CARNE C/FRITAS
    { menu_item_id: menuItems['Lomo especial de carne c/fritas'], ingredient_id: ingredients['Carne de res (lomo)'], quantity_required: 0.3, instructions: '1. Cocinar carne de lomo a la plancha\n2. Tostar pan\n3. Armar con lechuga, tomate, huevo, jamón, queso\n4. Freír papas por separado' },
    { menu_item_id: menuItems['Lomo especial de carne c/fritas'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo especial de carne c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Lomo especial de carne c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo especial de carne c/fritas'], ingredient_id: ingredients['Huevos'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo especial de carne c/fritas'], ingredient_id: ingredients['Jamón'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo especial de carne c/fritas'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.04 },
    { menu_item_id: menuItems['Lomo especial de carne c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Lomo especial de carne c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // LOMO ESPECIAL DE POLLO C/FRITAS
    { menu_item_id: menuItems['Lomo especial de pollo c/fritas'], ingredient_id: ingredients['Pechuga de pollo'], quantity_required: 0.25, instructions: '1. Cocinar pechuga de pollo a la plancha\n2. Tostar pan\n3. Armar con lechuga, tomate, huevo, jamón, queso\n4. Freír papas por separado' },
    { menu_item_id: menuItems['Lomo especial de pollo c/fritas'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo especial de pollo c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Lomo especial de pollo c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo especial de pollo c/fritas'], ingredient_id: ingredients['Huevos'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo especial de pollo c/fritas'], ingredient_id: ingredients['Jamón'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo especial de pollo c/fritas'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.04 },
    { menu_item_id: menuItems['Lomo especial de pollo c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Lomo especial de pollo c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // LOMO COMPLETO DE CARNE C/FRITAS
    { menu_item_id: menuItems['Lomo completo de carne c/fritas'], ingredient_id: ingredients['Carne de res (lomo)'], quantity_required: 0.3, instructions: '1. Cocinar carne de lomo\n2. Armar con lechuga, tomate, huevo\n3. Freír papas' },
    { menu_item_id: menuItems['Lomo completo de carne c/fritas'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo completo de carne c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Lomo completo de carne c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo completo de carne c/fritas'], ingredient_id: ingredients['Huevos'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo completo de carne c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Lomo completo de carne c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // LOMO COMPLETO DE POLLO C/FRITAS
    { menu_item_id: menuItems['Lomo completo de pollo c/fritas'], ingredient_id: ingredients['Pechuga de pollo'], quantity_required: 0.25, instructions: '1. Cocinar pollo\n2. Armar con lechuga, tomate, huevo\n3. Freír papas' },
    { menu_item_id: menuItems['Lomo completo de pollo c/fritas'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo completo de pollo c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Lomo completo de pollo c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo completo de pollo c/fritas'], ingredient_id: ingredients['Huevos'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo completo de pollo c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Lomo completo de pollo c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // LOMO AMERICANO DE CARNE C/FRITAS
    { menu_item_id: menuItems['Lomo americano de carne c/fritas'], ingredient_id: ingredients['Carne de res (lomo)'], quantity_required: 0.3, instructions: '1. Cocinar carne\n2. Armar con tomate y queso\n3. Freír papas' },
    { menu_item_id: menuItems['Lomo americano de carne c/fritas'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo americano de carne c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo americano de carne c/fritas'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.04 },
    { menu_item_id: menuItems['Lomo americano de carne c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Lomo americano de carne c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // LOMO AMERICANO DE POLLO C/FRITAS
    { menu_item_id: menuItems['Lomo americano de pollo c/fritas'], ingredient_id: ingredients['Pechuga de pollo'], quantity_required: 0.25, instructions: '1. Cocinar pollo\n2. Armar con tomate y queso\n3. Freír papas' },
    { menu_item_id: menuItems['Lomo americano de pollo c/fritas'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo americano de pollo c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo americano de pollo c/fritas'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.04 },
    { menu_item_id: menuItems['Lomo americano de pollo c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Lomo americano de pollo c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // LOMO SIMPLE DE CARNE C/FRITAS
    { menu_item_id: menuItems['Lomo simple de carne c/fritas'], ingredient_id: ingredients['Carne de res (lomo)'], quantity_required: 0.3, instructions: '1. Cocinar carne\n2. Armar con lechuga y tomate\n3. Freír papas' },
    { menu_item_id: menuItems['Lomo simple de carne c/fritas'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo simple de carne c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Lomo simple de carne c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo simple de carne c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Lomo simple de carne c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // LOMO SIMPLE DE CARNE VACÍO
    { menu_item_id: menuItems['Lomo simple de carne vacío'], ingredient_id: ingredients['Carne de res (lomo)'], quantity_required: 0.3, instructions: '1. Cocinar carne\n2. Armar con lechuga y tomate (sin papas)' },
    { menu_item_id: menuItems['Lomo simple de carne vacío'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo simple de carne vacío'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Lomo simple de carne vacío'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    
    // LOMO SIMPLE DE POLLO C/FRITAS
    { menu_item_id: menuItems['Lomo simple de pollo c/fritas'], ingredient_id: ingredients['Pechuga de pollo'], quantity_required: 0.25, instructions: '1. Cocinar pollo\n2. Armar con lechuga y tomate\n3. Freír papas' },
    { menu_item_id: menuItems['Lomo simple de pollo c/fritas'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo simple de pollo c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Lomo simple de pollo c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Lomo simple de pollo c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Lomo simple de pollo c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // LOMO SIMPLE DE POLLO VACÍO
    { menu_item_id: menuItems['Lomo simple de pollo vacío'], ingredient_id: ingredients['Pechuga de pollo'], quantity_required: 0.25, instructions: '1. Cocinar pollo\n2. Armar con lechuga y tomate (sin papas)' },
    { menu_item_id: menuItems['Lomo simple de pollo vacío'], ingredient_id: ingredients['Pan de lomo'], quantity_required: 1 },
    { menu_item_id: menuItems['Lomo simple de pollo vacío'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Lomo simple de pollo vacío'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    
    // HAMBURGUESA ESPECIAL C/FRITAS
    { menu_item_id: menuItems['Hamburguesa especial c/fritas'], ingredient_id: ingredients['Carne molida'], quantity_required: 0.15, instructions: '1. Formar hamburguesa\n2. Cocinar a la plancha\n3. Armar con lechuga, tomate, huevo, jamón, queso\n4. Freír papas' },
    { menu_item_id: menuItems['Hamburguesa especial c/fritas'], ingredient_id: ingredients['Pan de hamburguesa'], quantity_required: 1 },
    { menu_item_id: menuItems['Hamburguesa especial c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Hamburguesa especial c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Hamburguesa especial c/fritas'], ingredient_id: ingredients['Huevos'], quantity_required: 1 },
    { menu_item_id: menuItems['Hamburguesa especial c/fritas'], ingredient_id: ingredients['Jamón'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Hamburguesa especial c/fritas'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Hamburguesa especial c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Hamburguesa especial c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // HAMBURGUESA COMPLETA C/FRITAS
    { menu_item_id: menuItems['Hamburguesa completa c/fritas'], ingredient_id: ingredients['Carne molida'], quantity_required: 0.15, instructions: '1. Formar hamburguesa\n2. Cocinar\n3. Armar con lechuga, tomate, huevo\n4. Freír papas' },
    { menu_item_id: menuItems['Hamburguesa completa c/fritas'], ingredient_id: ingredients['Pan de hamburguesa'], quantity_required: 1 },
    { menu_item_id: menuItems['Hamburguesa completa c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Hamburguesa completa c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Hamburguesa completa c/fritas'], ingredient_id: ingredients['Huevos'], quantity_required: 1 },
    { menu_item_id: menuItems['Hamburguesa completa c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Hamburguesa completa c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // HAMBURGUESA AMERICANA C/FRITAS
    { menu_item_id: menuItems['Hamburguesa americana c/fritas'], ingredient_id: ingredients['Carne molida'], quantity_required: 0.15, instructions: '1. Formar hamburguesa\n2. Cocinar\n3. Armar con tomate y queso\n4. Freír papas' },
    { menu_item_id: menuItems['Hamburguesa americana c/fritas'], ingredient_id: ingredients['Pan de hamburguesa'], quantity_required: 1 },
    { menu_item_id: menuItems['Hamburguesa americana c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Hamburguesa americana c/fritas'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Hamburguesa americana c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Hamburguesa americana c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // HAMBURGUESA DOBLE C/FRITAS
    { menu_item_id: menuItems['Hamburguesa doble c/fritas'], ingredient_id: ingredients['Carne molida'], quantity_required: 0.3, instructions: '1. Formar dos hamburguesas\n2. Cocinar ambas\n3. Armar doble con lechuga, tomate, queso\n4. Freír papas' },
    { menu_item_id: menuItems['Hamburguesa doble c/fritas'], ingredient_id: ingredients['Pan de hamburguesa'], quantity_required: 1 },
    { menu_item_id: menuItems['Hamburguesa doble c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Hamburguesa doble c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.05 },
    { menu_item_id: menuItems['Hamburguesa doble c/fritas'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.06 },
    { menu_item_id: menuItems['Hamburguesa doble c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.4 },
    { menu_item_id: menuItems['Hamburguesa doble c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.07 },
    
    // HAMBURGUESA SIMPLE C/FRITAS
    { menu_item_id: menuItems['Hamburguesa simple c/fritas'], ingredient_id: ingredients['Carne molida'], quantity_required: 0.15, instructions: '1. Formar hamburguesa\n2. Cocinar\n3. Armar con lechuga y tomate\n4. Freír papas' },
    { menu_item_id: menuItems['Hamburguesa simple c/fritas'], ingredient_id: ingredients['Pan de hamburguesa'], quantity_required: 1 },
    { menu_item_id: menuItems['Hamburguesa simple c/fritas'], ingredient_id: ingredients['Lechuga'], quantity_required: 0.02 },
    { menu_item_id: menuItems['Hamburguesa simple c/fritas'], ingredient_id: ingredients['Tomate'], quantity_required: 0.03 },
    { menu_item_id: menuItems['Hamburguesa simple c/fritas'], ingredient_id: ingredients['Papas'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Hamburguesa simple c/fritas'], ingredient_id: ingredients['Aceite'], quantity_required: 0.05 },
    
    // PIZZA DOBLE MUZZARELLA
    { menu_item_id: menuItems['Pizza Doble muzzarella'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1, instructions: '1. Extender masa\n2. Agregar salsa de tomate\n3. Cubrir con doble muzzarella\n4. Hornear a 250°C por 12-15 min' },
    { menu_item_id: menuItems['Pizza Doble muzzarella'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.1 },
    { menu_item_id: menuItems['Pizza Doble muzzarella'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.4 },
    
    // PIZZA CALABRESA
    { menu_item_id: menuItems['Pizza Calabresa'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1, instructions: '1. Extender masa\n2. Agregar salsa y muzzarella\n3. Agregar longaniza y aceitunas\n4. Hornear' },
    { menu_item_id: menuItems['Pizza Calabresa'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.1 },
    { menu_item_id: menuItems['Pizza Calabresa'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.25 },
    { menu_item_id: menuItems['Pizza Calabresa'], ingredient_id: ingredients['Longaniza calabresa'], quantity_required: 0.15 },
    { menu_item_id: menuItems['Pizza Calabresa'], ingredient_id: ingredients['Aceitunas'], quantity_required: 0.05 },
    
    // PIZZA PANCETA
    { menu_item_id: menuItems['Pizza Panceta'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1, instructions: '1. Extender masa\n2. Agregar salsa y muzzarella\n3. Cubrir con panceta\n4. Hornear' },
    { menu_item_id: menuItems['Pizza Panceta'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.1 },
    { menu_item_id: menuItems['Pizza Panceta'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.25 },
    { menu_item_id: menuItems['Pizza Panceta'], ingredient_id: ingredients['Panceta'], quantity_required: 0.15 },
    
    // PIZZA CALABRESA Y PANCETA
    { menu_item_id: menuItems['Pizza Calabresa y Panceta'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1, instructions: '1. Extender masa\n2. Agregar salsa y muzzarella\n3. Agregar longaniza y panceta\n4. Hornear' },
    { menu_item_id: menuItems['Pizza Calabresa y Panceta'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.1 },
    { menu_item_id: menuItems['Pizza Calabresa y Panceta'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.25 },
    { menu_item_id: menuItems['Pizza Calabresa y Panceta'], ingredient_id: ingredients['Longaniza calabresa'], quantity_required: 0.1 },
    { menu_item_id: menuItems['Pizza Calabresa y Panceta'], ingredient_id: ingredients['Panceta'], quantity_required: 0.1 },
    
    // PIZZA ROQUEFORT
    { menu_item_id: menuItems['Pizza Roquefort'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1, instructions: '1. Extender masa\n2. Agregar salsa y muzzarella\n3. Agregar roquefort\n4. Hornear' },
    { menu_item_id: menuItems['Pizza Roquefort'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.1 },
    { menu_item_id: menuItems['Pizza Roquefort'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.2 },
    { menu_item_id: menuItems['Pizza Roquefort'], ingredient_id: ingredients['Queso roquefort'], quantity_required: 0.15 },
    
    // PIZZA CHOCLO
    { menu_item_id: menuItems['Pizza Choclo'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1, instructions: '1. Extender masa\n2. Agregar salsa y muzzarella\n3. Agregar choclo\n4. Hornear' },
    { menu_item_id: menuItems['Pizza Choclo'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.1 },
    { menu_item_id: menuItems['Pizza Choclo'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.25 },
    { menu_item_id: menuItems['Pizza Choclo'], ingredient_id: ingredients['Choclo'], quantity_required: 0.15 },
    
    // PIZZA LONGANIZA
    { menu_item_id: menuItems['Pizza Longaniza'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1, instructions: '1. Extender masa\n2. Agregar salsa y muzzarella\n3. Agregar longaniza\n4. Hornear' },
    { menu_item_id: menuItems['Pizza Longaniza'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.1 },
    { menu_item_id: menuItems['Pizza Longaniza'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.25 },
    { menu_item_id: menuItems['Pizza Longaniza'], ingredient_id: ingredients['Longaniza calabresa'], quantity_required: 0.15 },
    
    // PIZZA ESPECIAL (4 SABORES)
    { menu_item_id: menuItems['Pizza Especial (4 sabores)'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1, instructions: '1. Extender masa\n2. Dividir en 4 cuadrantes\n3. Agregar muzzarella + panceta, roquefort, choclo, longaniza\n4. Hornear' },
    { menu_item_id: menuItems['Pizza Especial (4 sabores)'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.12 },
    { menu_item_id: menuItems['Pizza Especial (4 sabores)'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.3 },
    { menu_item_id: menuItems['Pizza Especial (4 sabores)'], ingredient_id: ingredients['Panceta'], quantity_required: 0.08 },
    { menu_item_id: menuItems['Pizza Especial (4 sabores)'], ingredient_id: ingredients['Queso roquefort'], quantity_required: 0.08 },
    { menu_item_id: menuItems['Pizza Especial (4 sabores)'], ingredient_id: ingredients['Choclo'], quantity_required: 0.08 },
    { menu_item_id: menuItems['Pizza Especial (4 sabores)'], ingredient_id: ingredients['Longaniza calabresa'], quantity_required: 0.08 },
    
    // PIZZA GRANDE CALABRESA
    { menu_item_id: menuItems['Pizza Grande Calabresa'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1.5, instructions: '1. Extender masa grande\n2. Agregar salsa y muzzarella\n3. Agregar longaniza y aceitunas\n4. Hornear más tiempo' },
    { menu_item_id: menuItems['Pizza Grande Calabresa'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.15 },
    { menu_item_id: menuItems['Pizza Grande Calabresa'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.35 },
    { menu_item_id: menuItems['Pizza Grande Calabresa'], ingredient_id: ingredients['Longaniza calabresa'], quantity_required: 0.2 },
    { menu_item_id: menuItems['Pizza Grande Calabresa'], ingredient_id: ingredients['Aceitunas'], quantity_required: 0.08 },
    
    // PIZZA GRANDE PANCETA
    { menu_item_id: menuItems['Pizza Grande Panceta'], ingredient_id: ingredients['Masa de pizza'], quantity_required: 1.5, instructions: '1. Extender masa grande\n2. Agregar salsa y muzzarella\n3. Cubrir con panceta\n4. Hornear más tiempo' },
    { menu_item_id: menuItems['Pizza Grande Panceta'], ingredient_id: ingredients['Salsa de tomate'], quantity_required: 0.15 },
    { menu_item_id: menuItems['Pizza Grande Panceta'], ingredient_id: ingredients['Queso muzzarella'], quantity_required: 0.35 },
    { menu_item_id: menuItems['Pizza Grande Panceta'], ingredient_id: ingredients['Panceta'], quantity_required: 0.2 },
    
    // ADICIONALES (no requieren recetas complejas, son ingredientes simples)
    { menu_item_id: menuItems['Adicional Panceta'], ingredient_id: ingredients['Panceta'], quantity_required: 0.1, instructions: 'Porción extra de panceta' },
    { menu_item_id: menuItems['Adicional Roquefort'], ingredient_id: ingredients['Queso roquefort'], quantity_required: 0.08, instructions: 'Porción extra de queso roquefort' },
    { menu_item_id: menuItems['Adicional Cheddar'], ingredient_id: ingredients['Queso cheddar'], quantity_required: 0.08, instructions: 'Porción extra de queso cheddar' },
    { menu_item_id: menuItems['Adicional Cebolla'], ingredient_id: ingredients['Cebolla'], quantity_required: 0.05, instructions: 'Porción extra de cebolla' },
  ];

  for (const recipe of recipes) {
    try {
      if (!recipe.menu_item_id || !recipe.ingredient_id) {
        logger.warn('⚠️ Skipping recipe with missing menu_item or ingredient');
        continue;
      }

      await db.query(
        `INSERT INTO recipes (menu_item_id, ingredient_id, quantity_required, instructions)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (menu_item_id, ingredient_id) DO NOTHING`,
        [recipe.menu_item_id, recipe.ingredient_id, recipe.quantity_required, recipe.instructions || null]
      );

      logger.info(`✅ Recipe created for menu_item_id: ${recipe.menu_item_id}`);
    } catch (error) {
      logger.error('❌ Failed to create recipe', { error: error.message });
    }
  }

  logger.info('Recipes seeding completed');
}

module.exports = seedRecipes;
