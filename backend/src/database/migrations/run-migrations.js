const fs = require('fs');
const path = require('path');
const db = require('../connection');
const logger = require('../../utils/logger');

async function runMigrations() {
  const migrationsDir = __dirname;
  const files = fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  logger.info(`Found ${files.length} migration files`);

  for (const file of files) {
    try {
      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf8');
      
      logger.info(`Running migration: ${file}`);
      await db.query(sql);
      logger.info(`✅ Migration completed: ${file}`);
    } catch (error) {
      logger.error(`❌ Migration failed: ${file}`, { error: error.message });
      throw error;
    }
  }

  logger.info('All migrations completed successfully');
}

// Run if called directly
if (require.main === module) {
  runMigrations()
    .then(() => {
      logger.info('Migration process completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Migration process failed', { error: error.message });
      process.exit(1);
    });
}

module.exports = runMigrations;
