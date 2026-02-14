const runMigrations = require('../migrations/run-migrations');
const seedUsers = require('./001_seed_users');
const seedMenuItems = require('./002_seed_menu_items');
const seedIngredients = require('./003_seed_ingredients');
const seedCustomers = require('./004_seed_customers');
const seedRecipes = require('./005_seed_recipes');
const logger = require('../../utils/logger');

async function seedDatabase() {
  try {
    logger.info('Starting database seeding process...');

    // Run migrations first
    logger.info('Step 1/6: Running migrations...');
    await runMigrations();

    // Seed in order of dependencies
    logger.info('Step 2/6: Seeding users...');
    await seedUsers();

    logger.info('Step 3/6: Seeding menu items...');
    await seedMenuItems();

    logger.info('Step 4/6: Seeding ingredients...');
    await seedIngredients();

    logger.info('Step 5/6: Seeding customers...');
    await seedCustomers();

    logger.info('Step 6/6: Seeding recipes...');
    await seedRecipes();

    logger.info('✅ Database seeding completed successfully!');
  } catch (error) {
    logger.error('❌ Database seeding failed', { error: error.message });
    throw error;
  }
}

// Run if called directly
if (require.main === module) {
  seedDatabase()
    .then(() => {
      logger.info('Seeding process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Seeding process failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = seedDatabase;
