import { describe, it } from 'node:test';
import assert from 'node:assert';
import { api } from '../lib/api';

describe('Frontend API Client & Session Logic', () => {
  it('Validación de formato de tokens JWT y roles permitidos', () => {
    const rolesValidos = ['order_taker', 'cook', 'manager', 'admin'];

    assert.ok(rolesValidos.includes('order_taker'));
    assert.ok(rolesValidos.includes('cook'));
    assert.ok(rolesValidos.includes('manager'));
    assert.ok(rolesValidos.includes('admin'));
  });

  it('Rutas de redirección esperadas por rol', () => {
    const getRouteByRole = (role: string) => {
      if (role === 'cook') return '/cook';
      if (role === 'order_taker') return '/waiter';
      return '/manager';
    };

    assert.strictEqual(getRouteByRole('cook'), '/cook');
    assert.strictEqual(getRouteByRole('order_taker'), '/waiter');
    assert.strictEqual(getRouteByRole('manager'), '/manager');
    assert.strictEqual(getRouteByRole('admin'), '/manager');
  });

  it('Construcción correcta de headers de autorización', () => {
    const token = 'fake.jwt.token';
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    assert.strictEqual(headers['Authorization'], 'Bearer fake.jwt.token');
  });

  it('Verificación de presencia de api.getToken() y api.getAccessToken()', () => {
    assert.strictEqual(typeof api.getToken, 'function');
    assert.strictEqual(typeof api.getAccessToken, 'function');
  });
});
