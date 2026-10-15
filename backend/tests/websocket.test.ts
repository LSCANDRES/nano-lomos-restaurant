import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'http';
import { io as ClientSocket, Socket as ClientSocketType } from 'socket.io-client';
import { createApp } from '../src/app';
import { initializeWebSocket } from '../src/lib/websocket';
import { AuthService } from '../src/modules/auth/auth.service';
import { emitOrderCreated, emitOrderStatusChanged, emitLowStockAlert } from '../src/lib/websocket';

describe('WebSocket Real-Time Gateway Tests', () => {
  let httpServer: http.Server;
  let port: number;
  let waiterToken: string;
  let cookToken: string;
  let managerToken: string;

  before(async () => {
    const app = createApp();
    httpServer = http.createServer(app);
    initializeWebSocket(httpServer);

    await new Promise<void>((resolve) => {
      httpServer.listen(0, () => {
        const addr = httpServer.address() as any;
        port = addr.port;
        resolve();
      });
    });

    waiterToken = AuthService.generateTokens({
      id: 901,
      username: 'mozo_ws',
      email: 'mozo@test.com',
      role: 'waiter',
      full_name: 'Mozo WS',
    }).accessToken;

    cookToken = AuthService.generateTokens({
      id: 902,
      username: 'cocinero_ws',
      email: 'cocina@test.com',
      role: 'cook',
      full_name: 'Cocinero WS',
    }).accessToken;

    managerToken = AuthService.generateTokens({
      id: 903,
      username: 'gerente_ws',
      email: 'gerente@test.com',
      role: 'manager',
      full_name: 'Gerente WS',
    }).accessToken;
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      httpServer.close(() => resolve());
    });
  });

  it('debe rechazar conexiones sin token JWT válido', async () => {
    let connectionError: any = null;
    const client = ClientSocket(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: 'token_falso_invalido' },
    });

    await new Promise<void>((resolve) => {
      client.on('connect_error', (err) => {
        connectionError = err;
        client.disconnect();
        resolve();
      });
    });

    assert.ok(connectionError);
    assert.match(connectionError.message, /Authentication error/i);
  });

  it('debe permitir conexión exitosa para usuario autenticado (cocinero)', async () => {
    const cookClient = ClientSocket(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: cookToken },
    });

    await new Promise<void>((resolve) => {
      cookClient.on('connect', () => {
        assert.ok(cookClient.connected);
        cookClient.disconnect();
        resolve();
      });
    });
  });

  it('cocina debe recibir evento order:created cuando se crea un pedido', async () => {
    const cookClient: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: cookToken },
    });

    let receivedOrder: any = null;

    await new Promise<void>((resolve) => {
      cookClient.on('connect', () => {
        cookClient.on('order:created', (data) => {
          receivedOrder = data;
          cookClient.disconnect();
          resolve();
        });

        // Simular emisión de nuevo pedido
        emitOrderCreated({ id: 888, table_number: 'Mesa 4', status: 'pending' });
      });
    });

    assert.ok(receivedOrder);
    assert.strictEqual(receivedOrder.id, 888);
    assert.strictEqual(receivedOrder.table_number, 'Mesa 4');
  });

  it('mozo debe recibir order:status_changed cuando cocina completa un plato', async () => {
    const waiterClient: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: waiterToken },
    });

    let receivedStatus: any = null;

    await new Promise<void>((resolve) => {
      waiterClient.on('connect', () => {
        waiterClient.on('order:status_changed', (data) => {
          receivedStatus = data;
          waiterClient.disconnect();
          resolve();
        });

        // Simular despacho desde cocina
        emitOrderStatusChanged({ id: 888, status: 'ready_to_deliver' });
      });
    });

    assert.ok(receivedStatus);
    assert.strictEqual(receivedStatus.status, 'ready_to_deliver');
  });

  it('gerente debe recibir stock:low_alert cuando un insumo cae bajo el mínimo', async () => {
    const managerClient: ClientSocketType = ClientSocket(`http://localhost:${port}`, {
      transports: ['websocket'],
      auth: { token: managerToken },
    });

    let receivedAlert: any = null;

    await new Promise<void>((resolve) => {
      managerClient.on('connect', () => {
        managerClient.on('stock:low_alert', (data) => {
          receivedAlert = data;
          managerClient.disconnect();
          resolve();
        });

        // Simular alerta de stock crítico
        emitLowStockAlert({ id: 12, name: 'Pan de Lomo', current_stock: 4, min_stock: 20 });
      });
    });

    assert.ok(receivedAlert);
    assert.strictEqual(receivedAlert.name, 'Pan de Lomo');
    assert.strictEqual(receivedAlert.current_stock, 4);
  });
});
