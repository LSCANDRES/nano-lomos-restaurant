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
});
