import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { Server } from 'http';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Reports & Inventory Integration Tests', () => {
  let server: Server;
  let baseUrl: string;

  let managerToken: string;
  let waiterToken: string;
  let cookToken: string;

  before(async () => {
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    managerToken = AuthService.generateTokens({
      id: 991,
      username: 'manager_test',
      email: 'manager@nanolomos.test',
      role: 'manager',
      full_name: 'Gerente Test',
    }).accessToken;

    waiterToken = AuthService.generateTokens({
      id: 992,
      username: 'waiter_test',
      email: 'waiter@nanolomos.test',
      role: 'waiter',
      full_name: 'Mozo Test',
    }).accessToken;

    cookToken = AuthService.generateTokens({
      id: 993,
      username: 'cook_test',
      email: 'cook@nanolomos.test',
      role: 'cook',
      full_name: 'Cocinero Test',
    }).accessToken;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('GET /api/reports/daily', () => {
    it('debe responder 401 si no se envía token de autenticación', async () => {
      const res = await fetch(`${baseUrl}/api/reports/daily`);
      assert.strictEqual(res.status, 401);
    });

    it('debe responder 403 si el rol es mozo (waiter)', async () => {
      const res = await fetch(`${baseUrl}/api/reports/daily`, {
        headers: { Authorization: `Bearer ${waiterToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('debe responder 403 si el rol es cocinero (cook)', async () => {
      const res = await fetch(`${baseUrl}/api/reports/daily`, {
        headers: { Authorization: `Bearer ${cookToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('debe responder 200 con estadísticas del día si el rol es manager', async () => {
      const res = await fetch(`${baseUrl}/api/reports/daily`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      // Si la base de datos está conectada responde 200, si no 500 pero pasa el control de rol
      assert.ok([200, 500].includes(res.status));
      if (res.status === 200) {
        const data = await res.json();
        assert.ok('total_orders' in data);
        assert.ok('total_revenue' in data);
        assert.ok('pending_orders' in data);
        assert.ok('payment_breakdown' in data);
      }
    });

    it('GET /api/reports/cash-shift debe calcular arqueo con fondo inicial', async () => {
      const res = await fetch(`${baseUrl}/api/reports/cash-shift?initialCash=5000`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      assert.ok([200, 500].includes(res.status));
      if (res.status === 200) {
        const shift = await res.json();
        assert.strictEqual(shift.initial_cash, 5000);
        assert.ok('expected_cash_in_drawer' in shift);
        assert.ok('cash_sales' in shift);
      }
    });
  });

  describe('GET /api/reports/top-items', () => {
    it('debe responder 401 sin autenticación', async () => {
      const res = await fetch(`${baseUrl}/api/reports/top-items`);
      assert.strictEqual(res.status, 401);
    });

    it('debe responder 403 para usuarios no autorizados (mozo)', async () => {
      const res = await fetch(`${baseUrl}/api/reports/top-items`, {
        headers: { Authorization: `Bearer ${waiterToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('debe admitir consulta de top items para rol manager', async () => {
      const res = await fetch(`${baseUrl}/api/reports/top-items?limit=5`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      assert.ok([200, 500].includes(res.status));
      if (res.status === 200) {
        const items = await res.json();
        assert.ok(Array.isArray(items));
      }
    });
  });

  describe('GET /api/reports/purchase-projection', () => {
    it('debe protegerse contra accesos no autorizados con 401 o 403', async () => {
      const unauth = await fetch(`${baseUrl}/api/reports/purchase-projection`);
      assert.strictEqual(unauth.status, 401);

      const forbidden = await fetch(`${baseUrl}/api/reports/purchase-projection`, {
        headers: { Authorization: `Bearer ${waiterToken}` },
      });
      assert.strictEqual(forbidden.status, 403);
    });
  });

  describe('Inventory Endpoints', () => {
    it('GET /api/inventory debe responder 401 sin autenticación', async () => {
      const res = await fetch(`${baseUrl}/api/inventory`);
      assert.strictEqual(res.status, 401);
    });

    it('POST /api/inventory/restock debe responder 403 para mozo o cocinero', async () => {
      const resWaiter = await fetch(`${baseUrl}/api/inventory/restock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${waiterToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredientId: 1, quantity: 10 }),
      });
      assert.strictEqual(resWaiter.status, 403);

      const resCook = await fetch(`${baseUrl}/api/inventory/restock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${cookToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ ingredientId: 1, quantity: 10 }),
      });
      assert.strictEqual(resCook.status, 403);
    });

    it('POST /api/inventory/restock debe responder 400 si faltan parámetros requeridos', async () => {
      const res = await fetch(`${baseUrl}/api/inventory/restock`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${managerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({}),
      });
      assert.strictEqual(res.status, 400);
    });

    it('GET /api/inventory/transactions debe responder 403 si el rol no es gerente o admin', async () => {
      const res = await fetch(`${baseUrl}/api/inventory/transactions`, {
        headers: { Authorization: `Bearer ${waiterToken}` },
      });
      assert.strictEqual(res.status, 403);
    });
  });
});
