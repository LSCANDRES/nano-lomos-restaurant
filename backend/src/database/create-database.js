const { Client } = require('pg');
require('dotenv').config();

async function createDatabase() {
  // Connect to default postgres database
  const client = new Client({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: 'postgres', // Connect to default database
  });

  try {
    await client.connect();
    console.log('Connected to PostgreSQL server');

    // Check if database exists
    const checkResult = await client.query(
      `SELECT 1 FROM pg_database WHERE datname = $1`,
      [process.env.DB_NAME]
    );

    if (checkResult.rows.length === 0) {
      console.log(`Creating database: ${process.env.DB_NAME}`);
      await client.query(`CREATE DATABASE "${process.env.DB_NAME}"`);
      console.log(`✅ Database ${process.env.DB_NAME} created successfully`);
    } else {
      console.log(`Database ${process.env.DB_NAME} already exists`);
    }
  } catch (error) {
    console.error('Error creating database:', error.message);
    throw error;
  } finally {
    await client.end();
  }
}

createDatabase()
  .then(() => {
    console.log('Database setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Database setup failed:', error.message);
    process.exit(1);
  });
