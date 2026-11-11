import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Actualizando restricciones de PostgreSQL...');
  await prisma.$executeRawUnsafe(`ALTER TABLE orders DROP CONSTRAINT IF EXISTS orders_status_check;`);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE orders ADD CONSTRAINT orders_status_check CHECK (status IN ('pending', 'assigned', 'in_progress', 'ready_to_deliver', 'delivered', 'completed', 'paid', 'cancelled'));`
  );
  console.log('✅ orders_status_check actualizada.');

  await prisma.$executeRawUnsafe(`ALTER TABLE stock_transactions DROP CONSTRAINT IF EXISTS stock_transactions_transaction_type_check;`);
  await prisma.$executeRawUnsafe(
    `ALTER TABLE stock_transactions ADD CONSTRAINT stock_transactions_transaction_type_check CHECK (transaction_type IN ('purchase', 'usage', 'adjustment', 'restock', 'reversal'));`
  );
  console.log('✅ stock_transactions_transaction_type_check actualizada con: purchase, usage, adjustment, restock, reversal.');
}

main()
  .catch((e) => {
    console.error('❌ Error actualizando constraints:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
