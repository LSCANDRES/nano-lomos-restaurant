import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed de usuarios...');

  const users = [
    {
      username: 'admin',
      email: 'admin@nanolomos.cals.com.ar',
      password: 'admin123',
      fullName: 'Administrador General',
      role: 'manager',
    },
    {
      username: 'cocinero1',
      email: 'cocina1@nanolomos.cals.com.ar',
      password: 'cocina123',
      fullName: 'María García (Cocinera)',
      role: 'cook',
    },
    {
      username: 'pedidos1',
      email: 'mozo1@nanolomos.cals.com.ar',
      password: 'pedidos123',
      fullName: 'Ana Martínez (Moza)',
      role: 'order_taker',
    },
  ];

  for (const u of users) {
    const passwordHash = await bcrypt.hash(u.password, 10);

    const user = await prisma.users.upsert({
      where: { username: u.username },
      update: {
        email: u.email,
        full_name: u.fullName,
        role: u.role,
        is_active: true,
      },
      create: {
        username: u.username,
        email: u.email,
        password_hash: passwordHash,
        full_name: u.fullName,
        role: u.role,
        is_active: true,
        is_email_verified: true,
      },
    });

    console.log(`✅ Usuario listo: ${user.username} [rol: ${user.role}]`);
  }

  // Crear mesas iniciales del salón si no existen
  const defaultTables = [
    { number: '1', name: 'Mesa 1', capacity: 4, position_x: 10, position_y: 10 },
    { number: '2', name: 'Mesa 2', capacity: 4, position_x: 20, position_y: 10 },
    { number: '3', name: 'Mesa 3', capacity: 2, position_x: 30, position_y: 10 },
    { number: '4', name: 'Mesa 4', capacity: 6, position_x: 10, position_y: 30 },
    { number: '5', name: 'Mesa 5', capacity: 4, position_x: 20, position_y: 30 },
    { number: 'BARRA', name: 'Barra / Mostrador', capacity: 10, position_x: 30, position_y: 30 },
  ];

  for (const t of defaultTables) {
    await prisma.tables.upsert({
      where: { number: t.number },
      update: {},
      create: {
        number: t.number,
        name: t.name,
        capacity: t.capacity,
        position_x: t.position_x,
        position_y: t.position_y,
        is_active: true,
      },
    });
  }

  console.log('✅ Mesas iniciales creadas.');
  console.log('🎉 Seed completado con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
