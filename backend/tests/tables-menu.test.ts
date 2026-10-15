import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { Server } from 'http';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Tables & Menu Modules Tests', () => {
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

  it('GET /api/tables sin autenticación debe retornar 401', async () => {
    const res = await fetch(`${baseUrl}/api/tables`);
    assert.strictEqual(res.status, 401);
  });

  it('GET /api/menu sin autenticación debe retornar 401', async () => {
    const res = await fetch(`${baseUrl}/api/menu`);
    assert.strictEqual(res.status, 401);
  });

  it('POST /api/tables con rol mozo (order_taker) debe ser rechazado con 403', async () => {
    const { accessToken } = AuthService.generateTokens({
      id: 201,
      username: 'mozo1',
      email: 'mozo@test.com',
      role: 'order_taker',
      full_name: 'Mozo Test',
    });

    const res = await fetch(`${baseUrl}/api/tables`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ number: '99', capacity: 4 }),
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json() as any;
    assert.ok(body.error.includes('manager'));
  });

  it('POST /api/menu con rol cocinero (cook) debe ser rechazado con 403', async () => {
    const { accessToken } = AuthService.generateTokens({
      id: 202,
      username: 'cocinero1',
      email: 'cocina@test.com',
      role: 'cook',
      full_name: 'Cocinero Test',
    });

    const res = await fetch(`${baseUrl}/api/menu`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ name: 'Plato Nuevo', price: 5000 }),
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json() as any;
    assert.ok(body.error.includes('manager'));
  });
});
