const db = require('../connection');
const logger = require('../../utils/logger');

async function seedCustomers() {
  logger.info('Seeding customers...');

  const customers = [
    { first_name: 'Juan', last_name: 'Pérez', phone: '555-0101', email: 'juan.perez@email.com' },
    { first_name: 'María', last_name: 'López', phone: '555-0102', email: 'maria.lopez@email.com' },
    { first_name: 'Pedro', last_name: 'González', phone: '555-0103', email: null },
    { first_name: 'Laura', last_name: 'Martínez', phone: '555-0104', email: 'laura.martinez@email.com' },
    { first_name: 'Carlos', last_name: 'Sánchez', phone: null, email: null },
  ];

  for (const customer of customers) {
    try {
      await db.query(
        `INSERT INTO customers (first_name, last_name, phone, email)
         VALUES ($1, $2, $3, $4)`,
        [customer.first_name, customer.last_name, customer.phone, customer.email]
      );

      logger.info(`✅ Customer created: ${customer.first_name} ${customer.last_name}`);
    } catch (error) {
      logger.error(`❌ Failed to create customer: ${customer.first_name} ${customer.last_name}`, { error: error.message });
    }
  }

  logger.info('Customers seeding completed');
}

module.exports = seedCustomers;
