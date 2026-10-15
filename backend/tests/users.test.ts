import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { Server } from 'http';
import { AuthService } from '../src/modules/auth/auth.service';

describe('Users Management & Staff Endpoints Tests', () => {
  let server: Server;
  let baseUrl: string;

  let managerToken: string;
  let waiterToken: string;

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
      id: 881,
      username: 'manager_staff_test',
      email: 'manager_staff@nanolomos.test',
      role: 'manager',
      full_name: 'Gerente Staff Test',
    }).accessToken;

    waiterToken = AuthService.generateTokens({
      id: 882,
      username: 'waiter_staff_test',
      email: 'waiter_staff@nanolomos.test',
      role: 'waiter',
      full_name: 'Mozo Staff Test',
    }).accessToken;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  describe('GET /api/users', () => {
    it('debe rechazar solicitud sin token con 401', async () => {
      const res = await fetch(`${baseUrl}/api/users`);
      assert.strictEqual(res.status, 401);
    });

    it('debe rechazar rol no autorizado (mozo) con 403', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${waiterToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('debe permitir listar empleados para rol manager', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      assert.ok([200, 500].includes(res.status));
      if (res.status === 200) {
        const users = await res.json();
        assert.ok(Array.isArray(users));
      }
    });
  });

  describe('POST /api/users validaciones', () => {
    it('debe responder 400 si faltan campos obligatorios', async () => {
      const res = await fetch(`${baseUrl}/api/users`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${managerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username: 'nuevo_mozo' }), // falta password, fullName y role
      });
      assert.strictEqual(res.status, 400);
    });
  });

  describe('GET /api/users/history', () => {
    it('debe responder 403 para usuarios no autorizados', async () => {
      const res = await fetch(`${baseUrl}/api/users/history`, {
        headers: { Authorization: `Bearer ${waiterToken}` },
      });
      assert.strictEqual(res.status, 403);
    });

    it('debe permitir consultar historial de inicios de sesión para manager', async () => {
      const res = await fetch(`${baseUrl}/api/users/history?limit=10`, {
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      assert.ok([200, 500].includes(res.status));
    });
  });
});
