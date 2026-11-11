import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { Server } from 'http';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Orders & Kitchen Workflow Tests', () => {
  let server: Server;
  let baseUrl: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('GET /api/kitchen/queue sin autenticación debe retornar 401', async () => {
    const res = await fetch(`${baseUrl}/api/kitchen/queue`);
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/kitchen/queue con rol mozo (order_taker) debe ser rechazado con 403', async () => {
    const { accessToken } = AuthService.generateTokens({
      id: 301,
      username: 'mozo1',
      email: 'mozo@test.com',
      role: 'order_taker',
      full_name: 'Mozo',
    });

    const res = await fetch(`${baseUrl}/api/kitchen/queue`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json() as any;
    assert.ok(body.error.includes('cook'));
  });

  it('POST /api/orders con rol cocinero (cook) debe ser rechazado con 403', async () => {
    const { accessToken } = AuthService.generateTokens({
      id: 302,
      username: 'cocinero1',
      email: 'cocina@test.com',
      role: 'cook',
      full_name: 'Cocinero',
    });

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ items: [] }),
    });

    assert.strictEqual(res.status, 403);
  });

  it('POST /api/orders sin items debe retornar 400', async () => {
    const { accessToken } = AuthService.generateTokens({
      id: 303,
      username: 'mozo1',
      email: 'mozo@test.com',
      role: 'order_taker',
      full_name: 'Mozo',
    });

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ items: [] }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json() as any;
    assert.ok(body.error);
  });

  it('PATCH /api/orders/:id/cancel sin motivo debe retornar 400', async () => {
    const { accessToken } = AuthService.generateTokens({
      id: 304,
      username: 'mozo1',
      email: 'mozo@test.com',
      role: 'order_taker',
      full_name: 'Mozo',
    });

    const res = await fetch(`${baseUrl}/api/orders/999/cancel`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ reason: '' }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json() as any;
    assert.ok(body.error.includes('motivo'));
  });

  it('POST /api/orders con modalidad takeaway / delivery debe validar existencia de platos', async () => {
    const { accessToken } = AuthService.generateTokens({
      id: 305,
      username: 'cajero_mostrador',
      email: 'cajero@test.com',
      role: 'order_taker',
      full_name: 'Cajero Mostrador',
    });

    const res = await fetch(`${baseUrl}/api/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        orderType: 'takeaway',
        customerName: 'Lucas Mostrador',
        customerPhone: '+549351789456',
        items: [{ menuItemId: 999999, quantity: 1 }],
      }),
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json() as any;
    assert.ok(body.error.includes('no existen'));
  });

  it('PATCH /api/orders/:id/pay admite registrar método de pago (efectivo, tarjeta, transferencia)', async () => {
    const { accessToken } = AuthService.generateTokens({
      id: 306,
      username: 'mozo1',
      email: 'mozo@test.com',
      role: 'order_taker',
      full_name: 'Mozo',
    });

    const res = await fetch(`${baseUrl}/api/orders/999999/pay`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        paymentMethod: 'transferencia',
        notes: 'MercadoPago ref #78451',
      }),
    });

    // Como el ID 999999 no existe en BD, debe responder 400 con mensaje de error claro
    assert.strictEqual(res.status, 400);
    const body = await res.json() as any;
    assert.ok(body.error);
  });

  it('REST-008: Al completar pedido en cocina se envía alerta automática de WhatsApp al cliente', async () => {
    const { KitchenService } = await import('../src/modules/kitchen/kitchen.service');
    const { prisma } = await import('../src/lib/prisma');

    // 1. Obtener plato activo existente
    const menuItem = await prisma.menu_items.findFirst({ where: { is_active: true } });
    if (!menuItem) return;

    // 2. Crear cliente con teléfono
    const testPhone = '3804998877';
    const customer = await prisma.customers.create({
      data: {
        first_name: 'NanoCliente',
        last_name: 'TestWA',
        phone: testPhone,
      },
    });

    // 3. Obtener o usar usuario existente para cocinero
    const cookUser = (await prisma.users.findFirst({ where: { role: 'cook' } })) || (await prisma.users.findFirst());
    const cookId = cookUser ? cookUser.id : 1;
    const order = await prisma.orders.create({
      data: {
        customer_id: customer.id,
        table_number: '#99 (Retiro)',
        status: 'in_progress',
        assigned_cook_id: cookId,
        created_by: 1,
        started_at: new Date(),
        order_lines: {
          create: [
            {
              menu_item_id: menuItem.id,
              quantity: 1,
              unit_price: menuItem.price,
            },
          ],
        },
      },
    });

    try {
      // 4. Completar pedido desde cocina
      const result = await KitchenService.completeOrder(order.id, cookId);

      // 5. Validar que se marcó como listo y se notificó por WhatsApp
      assert.strictEqual(result.status, 'ready_to_deliver');
      assert.strictEqual(result.whatsappNotified, true);
      assert.strictEqual(result.whatsappPhone, testPhone);
    } finally {
      // 6. Limpieza
      await prisma.order_lines.deleteMany({ where: { order_id: order.id } });
      await prisma.orders.delete({ where: { id: order.id } });
      await prisma.customers.delete({ where: { id: customer.id } });
    }
  });
});
