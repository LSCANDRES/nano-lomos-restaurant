import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export const NANO_LOMOS_MENU = [
  // ================= SÁNDWICH / LOMITOS =================
  { name: 'Lomo Esp. Carne', category: 'Sándwich', price: 13000, description: 'Lomito de carne especial con jamón, queso, huevo, lechuga y tomate con papas fritas', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Lomo Esp. Pollo', category: 'Sándwich', price: 9000, description: 'Lomito de pechuga de pollo especial con jamón, queso, huevo, lechuga y tomate con papas', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Lomo Común Carne', category: 'Sándwich', price: 11000, description: 'Lomito tradicional de carne con jamón y queso en pan artesanal', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Lomo Común Pollo', category: 'Sándwich', price: 7500, description: 'Lomito tradicional de pollo con jamón y queso en pan artesanal', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Lomoluco', category: 'Sándwich', price: 15000, description: 'Lomito clásico bañado con queso fundido y aderezos especiales', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Lomo Esp. c/Roquefort', category: 'Sándwich', price: 15000, description: 'Bife de lomo tierno con salsa de queso roquefort fundido', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Super de Carne', category: 'Sándwich', price: 19000, description: 'Lomito gigante de carne con doble huevo, jamón, queso y papas', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Super de Pollo', category: 'Sándwich', price: 15000, description: 'Lomito gigante de pollo con doble huevo, jamón, queso y papas', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Super Lomoluco', category: 'Sándwich', price: 21000, description: 'Super lomito con cubierta especial de queso fundido abundante', imageUrl: '/images/menu/barroluco.jpg' },
  { name: 'Barroluco', category: 'Sándwich', price: 24000, description: 'Especialidad de la casa: lomito bañado completamente con manto de queso muzzarella fundido, morrón y aceituna', imageUrl: '/images/menu/barroluco.jpg' },
  { name: 'Milanesa Especial', category: 'Sándwich', price: 11000, description: 'Sándwich de milanesa casera con jamón, queso, lechuga y tomate', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Bondiola Especial', category: 'Sándwich', price: 10000, description: 'Sándwich de bondiola de cerdo marinada a la plancha con jamón y queso', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Bondiola XL', category: 'Sándwich', price: 15000, description: 'Bondiola en pan gigante con doble guarnición de papas fritas', imageUrl: '/images/menu/lomo-completo.jpg' },

  // ================= ESPECIALES =================
  { name: 'Sapi Especial c/Fritas (Para 4 Personas)', category: 'Especiales', price: 20000, description: 'Pan de viena gigante, carne picada sazonada, jamón, muzza, huevo, lechuga y tomate', imageUrl: '/images/menu/lomo-completo.jpg' },
  { name: 'Lomopizza', category: 'Especiales', price: 33000, description: 'Combinación monumental de lomito gigante y pizza a la piedra con muzzarella', imageUrl: '/images/menu/barroluco.jpg' },
  { name: 'Hamburpizza', category: 'Especiales', price: 25000, description: 'Pizza rellena con medallones de hamburguesa y queso cheddar fundido', imageUrl: '/images/menu/hamburguesa-especial.jpg' },

  // ================= HAMBURGUESAS =================
  { name: 'Hamburguesa Especial', category: 'Hamburguesas', price: 10000, description: 'Medallón artesanal con pan sésamo, huevo, cheddar, jamón, lechuga y tomate con fritas', imageUrl: '/images/menu/hamburguesa-especial.jpg' },
  { name: 'Hamburguesa Común', category: 'Hamburguesas', price: 8000, description: 'Medallón artesanal con jamón, queso y aderezos con papas', imageUrl: '/images/menu/hamburguesa-especial.jpg' },
  { name: 'Super Hamburguesa', category: 'Hamburguesas', price: 14000, description: 'Doble medallón de carne con panceta, cheddar y doble huevo', imageUrl: '/images/menu/hamburguesa-especial.jpg' },
  { name: 'Burguer c/Cheddar y Frita', category: 'Hamburguesas', price: 7000, description: 'Hamburguesa express con queso cheddar y porción de papas bastón', imageUrl: '/images/menu/hamburguesa-especial.jpg' },

  // ================= PIZZAS =================
  { name: 'Pizza Doble', category: 'Pizzas', price: 12000, description: 'Pizza a la piedra con doble porción de muzzarella', imageUrl: '/images/menu/carta-nanolomos.jpg' },
  { name: 'Pizza Común', category: 'Pizzas', price: 9500, description: 'Pizza tradicional con salsa de tomate casera y muzzarella', imageUrl: '/images/menu/carta-nanolomos.jpg' },
  { name: 'Pizza Especial', category: 'Pizzas', price: 11000, description: 'Pizza con muzzarella, jamón cocido, morrones y aceitunas verdes', imageUrl: '/images/menu/carta-nanolomos.jpg' },
  { name: 'Pizza Napolitana', category: 'Pizzas', price: 11000, description: 'Pizza con rodajas de tomate natural, ajo, orégano y muzzarella', imageUrl: '/images/menu/carta-nanolomos.jpg' },
  { name: 'Pizza Fugazza', category: 'Pizzas', price: 11000, description: 'Pizza con abundante cebolla caramelizada y queso muzzarella fundido', imageUrl: '/images/menu/carta-nanolomos.jpg' },
];

export async function seedNanoLomosMenu() {
  console.log('🌱 Cargando carta oficial de Nano Lomos en la base de datos...');

  for (const item of NANO_LOMOS_MENU) {
    const existing = await prisma.menu_items.findFirst({ where: { name: item.name } });

    if (existing) {
      await prisma.menu_items.update({
        where: { id: existing.id },
        data: {
          price: item.price,
          category: item.category,
          description: item.description,
          image_url: item.imageUrl,
          is_active: true,
        },
      });
      console.log(`🔄 Actualizado: ${item.name} ($${item.price})`);
    } else {
      await prisma.menu_items.create({
        data: {
          name: item.name,
          price: item.price,
          category: item.category,
          description: item.description,
          image_url: item.imageUrl,
          is_active: true,
        },
      });
      console.log(`✨ Creado: ${item.name} ($${item.price})`);
    }
  }

  console.log('✅ Carta oficial de Nano Lomos cargada exitosamente.');
}

if (require.main === module) {
  seedNanoLomosMenu()
    .catch((e) => console.error(e))
    .finally(async () => await prisma.$disconnect());
}
