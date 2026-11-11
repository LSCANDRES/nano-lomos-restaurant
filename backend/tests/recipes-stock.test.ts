import { describe, it } from 'node:test';
import assert from 'node:assert';
import { prisma } from '../src/lib/prisma';
import { OrdersService } from '../src/modules/orders/orders.service';

describe('Recetario Estándar y Descuento Automático de Stock (REST-005)', () => {
  it('Debe descontar stock de insumos según recetas al crear pedido cobrado en mostrador', async () => {
    // 1. Obtener plato oficial con receta (Lomo Esp. Carne)
    const dish = await prisma.menu_items.findFirst({
      where: { name: 'Lomo Esp. Carne' },
      include: {
        recipes: {
          include: { ingredients: true },
        },
      },
    });

    assert.ok(dish, 'El plato Lomo Esp. Carne debe existir en la base de datos');
    assert.ok(dish.recipes.length > 0, 'El plato debe tener recetas vinculadas');

    const firstRecipe = dish.recipes[0];
    const initialIng = await prisma.ingredients.findUnique({
      where: { id: firstRecipe.ingredient_id },
    });
    assert.ok(initialIng, 'El ingrediente debe existir');
    const initialStock = Number(initialIng.current_stock);
    const requiredPerDish = Number(firstRecipe.quantity_required);
    const orderQuantity = 2;

    // 2. Crear pedido cobrado en mostrador
    const createdOrder = await OrdersService.createOrder({
      customerName: 'Cliente Test Recetas',
      orderType: 'mostrador',
      paymentMethod: 'EFECTIVO',
      paymentNotes: 'Pago en caja mostrador test',
      createdBy: 1,
      items: [
        {
          menuItemId: dish.id,
          quantity: orderQuantity,
        },
      ],
    });

    assert.ok(createdOrder.id, 'La orden debe haberse creado');

    // 3. Verificar que el stock del ingrediente disminuyó exactamente requiredPerDish * orderQuantity
    const updatedIng = await prisma.ingredients.findUnique({
      where: { id: firstRecipe.ingredient_id },
    });
    assert.ok(updatedIng);
    const expectedStock = initialStock - (requiredPerDish * orderQuantity);
    assert.strictEqual(
      Number(updatedIng.current_stock).toFixed(2),
      expectedStock.toFixed(2),
      'El stock debe decrementarse según la fórmula de la receta'
    );

    // 4. Verificar que se registró la transacción en stock_transactions
    const transaction = await prisma.stock_transactions.findFirst({
      where: {
        reference_id: createdOrder.id,
        reference_type: 'order',
        ingredient_id: firstRecipe.ingredient_id,
        transaction_type: 'usage',
      },
    });
    assert.ok(transaction, 'Debe existir registro en stock_transactions');
    assert.strictEqual(
      Number(transaction.quantity).toFixed(2),
      (-requiredPerDish * orderQuantity).toFixed(2),
      'La cantidad registrada en la transacción debe coincidir con el consumo negativo'
    );

    // 5. Verificar idempotencia: llamar a payOrder no debe duplicar el descuento de stock
    await OrdersService.payOrder(createdOrder.id, 1, 'efectivo', 'Cobro confirmado');
    const ingAfterPay = await prisma.ingredients.findUnique({
      where: { id: firstRecipe.ingredient_id },
    });
    assert.strictEqual(
      Number(ingAfterPay!.current_stock).toFixed(2),
      expectedStock.toFixed(2),
      'Llamar a payOrder no debe descontar stock doble si ya fue descontado'
    );

    // 6. Verificar que si se cancela la comanda, el stock se restaura automáticamente
    // Primero cambiamos temporalmente el status a pending para permitir la cancelación en test
    await prisma.orders.update({
      where: { id: createdOrder.id },
      data: { status: 'pending' },
    });

    await OrdersService.cancelOrder(createdOrder.id, 'Cancelación por cliente arrepentido', 1, 'admin');

    const restoredIng = await prisma.ingredients.findUnique({
      where: { id: firstRecipe.ingredient_id },
    });
    assert.strictEqual(
      Number(restoredIng!.current_stock).toFixed(2),
      initialStock.toFixed(2),
      'El stock debe volver a su nivel original tras cancelar el pedido'
    );

    // 7. Verificar que se registró la transacción de reversión
    const reversalTx = await prisma.stock_transactions.findFirst({
      where: {
        reference_id: createdOrder.id,
        reference_type: 'order',
        ingredient_id: firstRecipe.ingredient_id,
        transaction_type: 'reversal',
      },
    });
    assert.ok(reversalTx, 'Debe registrarse una transacción de tipo reversal');
    assert.strictEqual(
      Number(reversalTx.quantity).toFixed(2),
      (requiredPerDish * orderQuantity).toFixed(2)
    );

    // Limpieza de datos de prueba
    await prisma.stock_transactions.deleteMany({ where: { reference_id: createdOrder.id } });
    await prisma.order_lines.deleteMany({ where: { order_id: createdOrder.id } });
    await prisma.orders.delete({ where: { id: createdOrder.id } });
  });
});
