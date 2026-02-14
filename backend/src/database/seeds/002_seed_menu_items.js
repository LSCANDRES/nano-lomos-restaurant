const db = require('../connection');
const logger = require('../../utils/logger');

async function seedMenuItems() {
  logger.info('Seeding menu items...');

  const menuItems = [
    // LOMOS
    {
      name: 'Lomo especial de carne c/fritas',
      description: 'Lomo de carne con lechuga, tomate, huevo, jamón, queso y papas fritas',
      price: 11000,
      category: 'Lomos',
    },
    {
      name: 'Lomo especial de pollo c/fritas',
      description: 'Lomo de pollo con lechuga, tomate, huevo, jamón, queso y papas fritas',
      price: 10000,
      category: 'Lomos',
    },
    {
      name: 'Lomo completo de carne c/fritas',
      description: 'Lomo de carne con lechuga, tomate, huevo y papas fritas',
      price: 9000,
      category: 'Lomos',
    },
    {
      name: 'Lomo completo de pollo c/fritas',
      description: 'Lomo de pollo con lechuga, tomate, huevo y papas fritas',
      price: 8500,
      category: 'Lomos',
    },
    {
      name: 'Lomo americano de carne c/fritas',
      description: 'Lomo de carne con tomate, queso y papas fritas',
      price: 7500,
      category: 'Lomos',
    },
    {
      name: 'Lomo americano de pollo c/fritas',
      description: 'Lomo de pollo con tomate, queso y papas fritas',
      price: 7000,
      category: 'Lomos',
    },
    {
      name: 'Lomo simple de carne c/fritas',
      description: 'Lomo de carne con lechuga, tomate y papas fritas',
      price: 6500,
      category: 'Lomos',
    },
    {
      name: 'Lomo simple de carne vacío',
      description: 'Lomo de carne con lechuga y tomate (sin papas)',
      price: 6000,
      category: 'Lomos',
    },
    {
      name: 'Lomo simple de pollo c/fritas',
      description: 'Lomo de pollo con lechuga, tomate y papas fritas',
      price: 6500,
      category: 'Lomos',
    },
    {
      name: 'Lomo simple de pollo vacío',
      description: 'Lomo de pollo con lechuga y tomate (sin papas)',
      price: 6000,
      category: 'Lomos',
    },
    // HAMBURGUESAS
    {
      name: 'Hamburguesa especial c/fritas',
      description: 'Hamburguesa de carne con lechuga, tomate, huevo, jamón, queso y papas fritas',
      price: 7500,
      category: 'Hamburguesas',
    },
    {
      name: 'Hamburguesa completa c/fritas',
      description: 'Hamburguesa de carne con lechuga, tomate, huevo y papas fritas',
      price: 6500,
      category: 'Hamburguesas',
    },
    {
      name: 'Hamburguesa americana c/fritas',
      description: 'Hamburguesa de carne con tomate, queso y papas fritas',
      price: 6000,
      category: 'Hamburguesas',
    },
    {
      name: 'Hamburguesa doble c/fritas',
      description: 'Doble hamburguesa de carne con lechuga, tomate, queso y papas fritas',
      price: 22000,
      category: 'Hamburguesas',
    },
    {
      name: 'Hamburguesa simple c/fritas',
      description: 'Hamburguesa de carne con lechuga, tomate y papas fritas',
      price: 5000,
      category: 'Hamburguesas',
    },
    // PIZZAS
    {
      name: 'Pizza Doble muzzarella',
      description: 'Pizza con doble queso muzzarella',
      price: 8500,
      category: 'Pizzas',
    },
    {
      name: 'Pizza Calabresa',
      description: 'Pizza con muzzarella, longaniza calabresa y aceitunas',
      price: 9000,
      category: 'Pizzas',
    },
    {
      name: 'Pizza Panceta',
      description: 'Pizza con muzzarella y panceta',
      price: 10000,
      category: 'Pizzas',
    },
    {
      name: 'Pizza Calabresa y Panceta',
      description: 'Pizza con muzzarella, longaniza calabresa y panceta',
      price: 11000,
      category: 'Pizzas',
    },
    {
      name: 'Pizza Roquefort',
      description: 'Pizza con muzzarella y queso roquefort',
      price: 10000,
      category: 'Pizzas',
    },
    {
      name: 'Pizza Choclo',
      description: 'Pizza con muzzarella y choclo',
      price: 8000,
      category: 'Pizzas',
    },
    {
      name: 'Pizza Longaniza',
      description: 'Pizza con muzzarella y longaniza',
      price: 8500,
      category: 'Pizzas',
    },
    {
      name: 'Pizza Especial (4 sabores)',
      description: 'Pizza con muzzarella, panceta, roquefort, choclo y longaniza',
      price: 20000,
      category: 'Pizzas',
    },
    {
      name: 'Pizza Grande Calabresa',
      description: 'Pizza grande con muzzarella, longaniza calabresa y aceitunas',
      price: 12000,
      category: 'Pizzas',
    },
    {
      name: 'Pizza Grande Panceta',
      description: 'Pizza grande con muzzarella y panceta',
      price: 13000,
      category: 'Pizzas',
    },
    // ADICIONALES
    {
      name: 'Adicional Panceta',
      description: 'Porción extra de panceta para agregar a tu pedido',
      price: 1500,
      category: 'Adicionales',
    },
    {
      name: 'Adicional Roquefort',
      description: 'Porción extra de queso roquefort para agregar a tu pedido',
      price: 1500,
      category: 'Adicionales',
    },
    {
      name: 'Adicional Cheddar',
      description: 'Porción extra de queso cheddar para agregar a tu pedido',
      price: 1200,
      category: 'Adicionales',
    },
    {
      name: 'Adicional Cebolla',
      description: 'Porción extra de cebolla para agregar a tu pedido',
      price: 500,
      category: 'Adicionales',
    },
  ];

  for (const item of menuItems) {
    try {
      await db.query(
        `INSERT INTO menu_items (name, description, price, category, is_active)
         VALUES ($1, $2, $3, $4, true)`,
        [item.name, item.description, item.price, item.category]
      );

      logger.info(`✅ Menu item created: ${item.name}`);
    } catch (error) {
      logger.error(`❌ Failed to create menu item: ${item.name}`, { error: error.message });
    }
  }

  logger.info('Menu items seeding completed');
}

module.exports = seedMenuItems;
