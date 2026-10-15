import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import { createApp } from '../src/app';
import { Server } from 'http';
import { AuthService } from '../src/modules/auth/auth.service';
import { requireAuth } from '../src/middleware/requireAuth';
import { requireRole } from '../src/middleware/requireRole';
import express from 'express';

describe('Auth Module & Security Tests', () => {
  let server: Server;
  let baseUrl: string;

  let roleServer: Server;
  let roleBaseUrl: string;

  before(async () => {
    // 1. Servidor de la App principal
    const app = createApp();
    await new Promise<void>((resolve) => {
      server = app.listen(0, () => {
        const addr = server.address() as any;
        baseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });

    // 2. Servidor de pruebas para middlewares requireAuth y requireRole
    const testApp = express();
    testApp.use(express.json());

    testApp.get('/test/manager-only', requireAuth, requireRole('manager'), (_req, res) => {
      res.json({ message: 'Bienvenido gerente' });
    });

    testApp.get('/test/cook-only', requireAuth, requireRole('cook'), (_req, res) => {
      res.json({ message: 'Bienvenido cocina' });
    });

    testApp.get('/test/waiter-only', requireAuth, requireRole('order_taker'), (_req, res) => {
      res.json({ message: 'Bienvenido mozo' });
    });

    await new Promise<void>((resolve) => {
      roleServer = testApp.listen(0, () => {
        const addr = roleServer.address() as any;
        roleBaseUrl = `http://localhost:${addr.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
    await new Promise<void>((resolve) => roleServer.close(() => resolve()));
  });

  it('POST /api/auth/login sin datos debe responder 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json() as any;
    assert.ok(body.error);
  });

  it('POST /api/auth/login con credenciales falsas debe responder 401', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: 'usuario_inexistente', password: 'bad_password' }),
    });
    assert.strictEqual(res.status, 401);
    const body = await res.json() as any;
    assert.ok(body.error);
  });

  it('POST /api/auth/google sin idToken debe responder 400', async () => {
    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    assert.strictEqual(res.status, 400);
    const body = await res.json() as any;
    assert.ok(body.error);
  });

  it('GET /api/auth/me sin token debe responder 401 No autorizado', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`);
    assert.strictEqual(res.status, 401);
  });

  it('Generación y validación de JWT con roles correctos', () => {
    const fakeMozo = {
      id: 999,
      username: 'mozo_test',
      email: 'mozo@test.com',
      role: 'order_taker',
      full_name: 'Mozo Test',
    };

    const tokens = AuthService.generateTokens(fakeMozo);
    assert.ok(tokens.accessToken);
    assert.ok(tokens.refreshToken);
    assert.strictEqual(tokens.user.role, 'order_taker');
  });

  it('Control de Roles: Mozo no puede acceder a ruta de Gerente (403)', async () => {
    const fakeMozo = {
      id: 101,
      username: 'mozo1',
      email: 'mozo1@test.com',
      role: 'order_taker',
      full_name: 'Mozo',
    };
    const { accessToken } = AuthService.generateTokens(fakeMozo);

    const res = await fetch(`${roleBaseUrl}/test/manager-only`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(res.status, 403);
    const body = await res.json() as any;
    assert.ok(body.error.includes('manager'));
  });

  it('Control de Roles: Gerente accede exitosamente a ruta de Gerente (200)', async () => {
    const fakeManager = {
      id: 102,
      username: 'admin',
      email: 'admin@test.com',
      role: 'manager',
      full_name: 'Gerente General',
    };
    const { accessToken } = AuthService.generateTokens(fakeManager);

    const res = await fetch(`${roleBaseUrl}/test/manager-only`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(res.status, 200);
    const body = await res.json() as any;
    assert.strictEqual(body.message, 'Bienvenido gerente');
  });

  it('Control de Roles: Admin técnico tiene acceso irrestricto (200)', async () => {
    const fakeAdmin = {
      id: 1,
      username: 'superadmin',
      email: 'super@test.com',
      role: 'admin',
      full_name: 'Admin Técnico',
    };
    const { accessToken } = AuthService.generateTokens(fakeAdmin);

    const res = await fetch(`${roleBaseUrl}/test/cook-only`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    assert.strictEqual(res.status, 200);
  });
});
