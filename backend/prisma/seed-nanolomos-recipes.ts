import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface RecipeIngredientRequirement {
  ingredientName: string;
  quantityRequired: number; // Decimal
}

interface DishRecipeDef {
  dishName: string;
  instructions: string;
  ingredients: RecipeIngredientRequirement[];
}

export const NANOLOMOS_RECIPES: DishRecipeDef[] = [
  // ================= SÁNDWICHES Y LOMITOS =================
  {
    dishName: 'Lomo Esp. Carne',
    instructions: 'Plancha caliente a 220°C. Sellar bife de lomo con toque de sal y pimienta. Tostar pan de lomo artesanal. Montar lechuga fresca, rodajas de tomate, bife de lomo tierno, jamón cocido y muzzarella derretida sobre la plancha, coronar con huevo a la plancha. Acompañar con cono de papas fritas doradas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Carne de res (lomo)', quantityRequired: 0.35 },
      { ingredientName: 'Jamón', quantityRequired: 0.04 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.05 },
      { ingredientName: 'Huevos', quantityRequired: 1 },
      { ingredientName: 'Tomate', quantityRequired: 0.05 },
      { ingredientName: 'Lechuga', quantityRequired: 0.03 },
      { ingredientName: 'Papas', quantityRequired: 0.30 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Lomo Esp. Pollo',
    instructions: 'Grillar pechuga de pollo a punto dorado jugoso. Tostar pan de lomo. Montar cama de lechuga y tomate, pechuga grillada, jamón, muzzarella fundida y huevo a la plancha. Guarnición de papas fritas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Pechuga de pollo', quantityRequired: 0.30 },
      { ingredientName: 'Jamón', quantityRequired: 0.04 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.05 },
      { ingredientName: 'Huevos', quantityRequired: 1 },
      { ingredientName: 'Tomate', quantityRequired: 0.05 },
      { ingredientName: 'Lechuga', quantityRequired: 0.03 },
      { ingredientName: 'Papas', quantityRequired: 0.30 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Lomo Común Carne',
    instructions: 'Bife de lomo tradicional a la plancha con jamón y abundante queso derretido en pan tostado con papas fritas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Carne de res (lomo)', quantityRequired: 0.30 },
      { ingredientName: 'Jamón', quantityRequired: 0.04 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.05 },
      { ingredientName: 'Papas', quantityRequired: 0.25 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Lomo Común Pollo',
    instructions: 'Pechuga de pollo grillada con jamón y queso muzzarella fundido en pan de lomito crocante con papas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Pechuga de pollo', quantityRequired: 0.25 },
      { ingredientName: 'Jamón', quantityRequired: 0.04 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.05 },
      { ingredientName: 'Papas', quantityRequired: 0.25 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Lomoluco',
    instructions: 'Lomito clásico bañado con queso fundido hirviendo y aderezos especiales de la casa con papas fritas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Carne de res (lomo)', quantityRequired: 0.35 },
      { ingredientName: 'Jamón', quantityRequired: 0.04 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.12 }, // Baño de queso extra
      { ingredientName: 'Huevos', quantityRequired: 1 },
      { ingredientName: 'Papas', quantityRequired: 0.30 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Lomo Esp. c/Roquefort',
    instructions: 'Bife de lomo premium a la plancha bañado en salsa fundida de auténtico queso roquefort azul y muzzarella.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Carne de res (lomo)', quantityRequired: 0.35 },
      { ingredientName: 'Queso roquefort', quantityRequired: 0.08 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.05 },
      { ingredientName: 'Jamón', quantityRequired: 0.04 },
      { ingredientName: 'Papas', quantityRequired: 0.30 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Super de Carne',
    instructions: 'Edición gigante: doble bife de lomo vacuno, doble huevo frito/plancha, jamón, muzzarella y montaña de papas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Carne de res (lomo)', quantityRequired: 0.50 },
      { ingredientName: 'Jamón', quantityRequired: 0.06 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.08 },
      { ingredientName: 'Huevos', quantityRequired: 2 },
      { ingredientName: 'Tomate', quantityRequired: 0.06 },
      { ingredientName: 'Lechuga', quantityRequired: 0.04 },
      { ingredientName: 'Papas', quantityRequired: 0.45 },
      { ingredientName: 'Aceite', quantityRequired: 0.07 },
    ],
  },
  {
    dishName: 'Super de Pollo',
    instructions: 'Edición gigante de pechuga de pollo grillada doble con doble huevo, jamón, queso y porción XL de papas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Pechuga de pollo', quantityRequired: 0.45 },
      { ingredientName: 'Jamón', quantityRequired: 0.06 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.08 },
      { ingredientName: 'Huevos', quantityRequired: 2 },
      { ingredientName: 'Tomate', quantityRequired: 0.06 },
      { ingredientName: 'Lechuga', quantityRequired: 0.04 },
      { ingredientName: 'Papas', quantityRequired: 0.45 },
      { ingredientName: 'Aceite', quantityRequired: 0.07 },
    ],
  },
  {
    dishName: 'Super Lomoluco',
    instructions: 'Super lomito XL con baño de queso derretido en cascada hirviendo sobre la comanda completa.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Carne de res (lomo)', quantityRequired: 0.50 },
      { ingredientName: 'Jamón', quantityRequired: 0.06 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.18 },
      { ingredientName: 'Huevos', quantityRequired: 2 },
      { ingredientName: 'Papas', quantityRequired: 0.45 },
      { ingredientName: 'Aceite', quantityRequired: 0.07 },
    ],
  },
  {
    dishName: 'Barroluco',
    instructions: 'Especialidad insigne de la casa: sándwich de lomo gigante gratinado completamente con 250g de muzzarella dorada, aceitunas verdes, tiras de morrón y abundante papa frita.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Carne de res (lomo)', quantityRequired: 0.55 },
      { ingredientName: 'Jamón', quantityRequired: 0.08 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.25 },
      { ingredientName: 'Morrón', quantityRequired: 0.03 },
      { ingredientName: 'Aceitunas', quantityRequired: 0.03 },
      { ingredientName: 'Papas', quantityRequired: 0.50 },
      { ingredientName: 'Aceite', quantityRequired: 0.08 },
    ],
  },
  {
    dishName: 'Milanesa Especial',
    instructions: 'Milanesa de carne dorada con jamón, queso muzzarella fundido, huevo frito, tomate, lechuga y papas fritas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Milanesa de carne', quantityRequired: 1 },
      { ingredientName: 'Jamón', quantityRequired: 0.04 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.05 },
      { ingredientName: 'Huevos', quantityRequired: 1 },
      { ingredientName: 'Tomate', quantityRequired: 0.05 },
      { ingredientName: 'Lechuga', quantityRequired: 0.03 },
      { ingredientName: 'Papas', quantityRequired: 0.30 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Bondiola Especial',
    instructions: 'Bife jugoso de bondiola de cerdo a la plancha con jamón, queso derretido, huevo, lechuga, tomate y papas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Bondiola de cerdo', quantityRequired: 0.30 },
      { ingredientName: 'Jamón', quantityRequired: 0.04 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.05 },
      { ingredientName: 'Huevos', quantityRequired: 1 },
      { ingredientName: 'Tomate', quantityRequired: 0.05 },
      { ingredientName: 'Lechuga', quantityRequired: 0.03 },
      { ingredientName: 'Papas', quantityRequired: 0.30 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Bondiola XL',
    instructions: 'Doble bife de bondiola de cerdo tierna a la plancha con doble huevo, jamón, abundante muzzarella y papas.',
    ingredients: [
      { ingredientName: 'Pan de lomo', quantityRequired: 1 },
      { ingredientName: 'Bondiola de cerdo', quantityRequired: 0.50 },
      { ingredientName: 'Jamón', quantityRequired: 0.06 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.08 },
      { ingredientName: 'Huevos', quantityRequired: 2 },
      { ingredientName: 'Papas', quantityRequired: 0.45 },
      { ingredientName: 'Aceite', quantityRequired: 0.07 },
    ],
  },
  {
    dishName: 'Sapi Especial c/Fritas (Para 4 Personas)',
    instructions: 'Bandeja gigante para 4 personas: 4 panes de viena artesanales con salteado de carne picada jugosa, jamón, muzzarella derretida, 4 huevos a la plancha, lechuga, tomate y 800g de papas fritas.',
    ingredients: [
      { ingredientName: 'Pan de viena', quantityRequired: 4 },
      { ingredientName: 'Carne molida', quantityRequired: 0.60 },
      { ingredientName: 'Jamón', quantityRequired: 0.15 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.20 },
      { ingredientName: 'Huevos', quantityRequired: 4 },
      { ingredientName: 'Tomate', quantityRequired: 0.15 },
      { ingredientName: 'Lechuga', quantityRequired: 0.10 },
      { ingredientName: 'Papas', quantityRequired: 0.80 },
      { ingredientName: 'Aceite', quantityRequired: 0.12 },
    ],
  },
  {
    dishName: 'Lomopizza',
    instructions: 'Pizza rellena con bife de lomo vacuno sellado a la plancha, jamón cocido, muzzarella y salsa de tomate.',
    ingredients: [
      { ingredientName: 'Masa de pizza', quantityRequired: 1 },
      { ingredientName: 'Salsa de tomate', quantityRequired: 0.10 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.35 },
      { ingredientName: 'Carne de res (lomo)', quantityRequired: 0.40 },
      { ingredientName: 'Jamón', quantityRequired: 0.08 },
      { ingredientName: 'Aceitunas', quantityRequired: 0.04 },
    ],
  },
  {
    dishName: 'Hamburpizza',
    instructions: 'Masa artesanal con salsa, muzzarella fundida y base de medallones de carne molida sazonada con aceitunas.',
    ingredients: [
      { ingredientName: 'Masa de pizza', quantityRequired: 1 },
      { ingredientName: 'Salsa de tomate', quantityRequired: 0.10 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.35 },
      { ingredientName: 'Carne molida', quantityRequired: 0.35 },
      { ingredientName: 'Jamón', quantityRequired: 0.08 },
      { ingredientName: 'Aceitunas', quantityRequired: 0.04 },
    ],
  },

  // ================= HAMBURGUESAS =================
  {
    dishName: 'Hamburguesa Especial',
    instructions: 'Medallón de carne a la plancha, pan tostado con sésamo, lechuga, tomate, jamón, queso muzzarella y huevo frito.',
    ingredients: [
      { ingredientName: 'Pan de hamburguesa', quantityRequired: 1 },
      { ingredientName: 'Carne molida', quantityRequired: 0.18 },
      { ingredientName: 'Jamón', quantityRequired: 0.03 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.04 },
      { ingredientName: 'Huevos', quantityRequired: 1 },
      { ingredientName: 'Tomate', quantityRequired: 0.04 },
      { ingredientName: 'Lechuga', quantityRequired: 0.03 },
      { ingredientName: 'Papas', quantityRequired: 0.25 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Hamburguesa Común',
    instructions: 'Medallón artesanal con jamón y queso muzzarella fundido en pan suave con papas fritas.',
    ingredients: [
      { ingredientName: 'Pan de hamburguesa', quantityRequired: 1 },
      { ingredientName: 'Carne molida', quantityRequired: 0.18 },
      { ingredientName: 'Jamón', quantityRequired: 0.03 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.04 },
      { ingredientName: 'Papas', quantityRequired: 0.25 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Super Hamburguesa',
    instructions: 'Doble medallón de carne (360g), doble huevo a la plancha, doble queso, jamón, lechuga, tomate y papas fritas.',
    ingredients: [
      { ingredientName: 'Pan de hamburguesa', quantityRequired: 1 },
      { ingredientName: 'Carne molida', quantityRequired: 0.36 },
      { ingredientName: 'Jamón', quantityRequired: 0.06 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.08 },
      { ingredientName: 'Huevos', quantityRequired: 2 },
      { ingredientName: 'Tomate', quantityRequired: 0.05 },
      { ingredientName: 'Lechuga', quantityRequired: 0.04 },
      { ingredientName: 'Papas', quantityRequired: 0.35 },
      { ingredientName: 'Aceite', quantityRequired: 0.06 },
    ],
  },
  {
    dishName: 'Burguer c/Cheddar y Frita',
    instructions: 'Medallón artesanal con triple feta de queso cheddar fundido y porción generosa de papas bastón doradas.',
    ingredients: [
      { ingredientName: 'Pan de hamburguesa', quantityRequired: 1 },
      { ingredientName: 'Carne molida', quantityRequired: 0.18 },
      { ingredientName: 'Queso cheddar', quantityRequired: 0.08 },
      { ingredientName: 'Papas', quantityRequired: 0.25 },
      { ingredientName: 'Aceite', quantityRequired: 0.05 },
    ],
  },

  // ================= PIZZAS =================
  {
    dishName: 'Pizza Doble',
    instructions: 'Masa artesanal a la piedra, salsa de tomate de la casa, 450g de muzzarella extra gratinada y aceitunas verdes.',
    ingredients: [
      { ingredientName: 'Masa de pizza', quantityRequired: 1 },
      { ingredientName: 'Salsa de tomate', quantityRequired: 0.10 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.45 },
      { ingredientName: 'Aceitunas', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Pizza Común',
    instructions: 'Masa casera crujiente, salsa de tomates seleccionados, 250g de muzzarella derretida y aceitunas verdes.',
    ingredients: [
      { ingredientName: 'Masa de pizza', quantityRequired: 1 },
      { ingredientName: 'Salsa de tomate', quantityRequired: 0.10 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.25 },
      { ingredientName: 'Aceitunas', quantityRequired: 0.04 },
    ],
  },
  {
    dishName: 'Pizza Especial',
    instructions: 'Masa a la piedra con salsa, muzzarella, jamón cocido seleccionado en tiras, morrones asados y aceitunas.',
    ingredients: [
      { ingredientName: 'Masa de pizza', quantityRequired: 1 },
      { ingredientName: 'Salsa de tomate', quantityRequired: 0.10 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.30 },
      { ingredientName: 'Jamón', quantityRequired: 0.08 },
      { ingredientName: 'Morrón', quantityRequired: 0.05 },
      { ingredientName: 'Aceitunas', quantityRequired: 0.05 },
    ],
  },
  {
    dishName: 'Pizza Napolitana',
    instructions: 'Masa crocante con muzzarella dorada, rodajas de tomate fresco, toque de ajo picado y orégano.',
    ingredients: [
      { ingredientName: 'Masa de pizza', quantityRequired: 1 },
      { ingredientName: 'Salsa de tomate', quantityRequired: 0.10 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.30 },
      { ingredientName: 'Tomate', quantityRequired: 0.12 },
      { ingredientName: 'Ajo', quantityRequired: 0.01 },
      { ingredientName: 'Aceitunas', quantityRequired: 0.04 },
    ],
  },
  {
    dishName: 'Pizza Fugazza',
    instructions: 'Masa artesanal cubierta con 300g de muzzarella y salteado abundante de cebolla dorada al horno con orégano.',
    ingredients: [
      { ingredientName: 'Masa de pizza', quantityRequired: 1 },
      { ingredientName: 'Queso muzzarella', quantityRequired: 0.30 },
      { ingredientName: 'Cebolla', quantityRequired: 0.20 },
      { ingredientName: 'Aceitunas', quantityRequired: 0.04 },
    ],
  },
];

async function main() {
  console.log('📦 Asegurando insumos base para Nano Lomos...');

  const requiredIngredients = [
    { name: 'Bondiola de cerdo', unit: 'kg', currentStock: 35, minStock: 8, unitCost: 7500 },
    { name: 'Milanesa de carne', unit: 'unidades', currentStock: 50, minStock: 12, unitCost: 3500 },
    { name: 'Pan de viena', unit: 'unidades', currentStock: 80, minStock: 20, unitCost: 600 },
  ];

  for (const ing of requiredIngredients) {
    await prisma.ingredients.upsert({
      where: { name: ing.name },
      update: {},
      create: {
        name: ing.name,
        unit: ing.unit,
        current_stock: ing.currentStock,
        min_stock: ing.minStock,
        unit_cost: ing.unitCost,
      },
    });
    console.log(`✅ Insumo verificado: ${ing.name}`);
  }

  console.log('\n🍳 Vinculando recetas oficiales de Nano Lomos...');

  const allIngredients = await prisma.ingredients.findMany();
  const ingMap = new Map(allIngredients.map((i) => [i.name.toLowerCase().trim(), i]));

  for (const recipeDef of NANOLOMOS_RECIPES) {
    const dish = await prisma.menu_items.findFirst({
      where: { name: recipeDef.dishName },
    });

    if (!dish) {
      console.warn(`⚠️ Plato no encontrado en la carta: "${recipeDef.dishName}"`);
      continue;
    }

    // Limpiar recetas previas del plato para reasignar el estándar oficial
    await prisma.recipes.deleteMany({
      where: { menu_item_id: dish.id },
    });

    for (const ingReq of recipeDef.ingredients) {
      const ing = ingMap.get(ingReq.ingredientName.toLowerCase().trim());
      if (!ing) {
        console.error(`❌ Insumo no encontrado: "${ingReq.ingredientName}" para plato "${dish.name}"`);
        continue;
      }

      await prisma.recipes.create({
        data: {
          menu_item_id: dish.id,
          ingredient_id: ing.id,
          quantity_required: ingReq.quantityRequired,
          instructions: recipeDef.instructions,
        },
      });
    }

    console.log(`✨ Receta vinculada para [${dish.name}]: ${recipeDef.ingredients.length} insumos.`);
  }

  console.log('\n🎉 Recetario oficial de Nano Lomos cargado al 100%.');
}

main()
  .catch((e) => {
    console.error('❌ Error vinculando recetas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
