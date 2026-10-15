# Próximos Pasos — NanLomo

Fase 2 (scaffolding) completada. Documentación de lo que sigue.

---

## ✅ Completado (Fase 2)

- [x] Backup DB NANOLOMOS → `/data/backups/nanolomos-backup-20260430-*.dump`
- [x] Código legacy archivado en `legacy/`
- [x] Backend Express+TS+Prisma inicializado, estructura completa
- [x] Prisma schema generado desde DB existente (8 tablas)
- [x] Frontend Next.js 14 inicializado
- [x] Dockerfiles adaptados (backend + frontend)
- [x] docker-compose.prod.yml copiado al server
- [x] .env creado en server (`/data/nanlomo/.env`) y local
- [x] Workflows GitHub Actions adaptados
- [x] README actualizado
- [x] nginx.conf listo (server, deshabilitado por ahora)

---

## 📋 Fase 3 — Auth + Migraciones BD

### 3.1 Migración Prisma (agregar campos auth + tabla tables)

1. **Crear migración SQL manual** en `backend/prisma/migrations/`:

```sql
-- 0001_auth_and_tables.sql

-- 1. ALTER users: agregar campos de auth
ALTER TABLE users
  ADD COLUMN email VARCHAR(100) UNIQUE,
  ADD COLUMN provider VARCHAR(20) DEFAULT 'local',
  ADD COLUMN google_id VARCHAR(100) UNIQUE,
  ADD COLUMN avatar_url VARCHAR(500),
  ADD COLUMN is_email_verified BOOLEAN DEFAULT false,
  ADD COLUMN last_login_at TIMESTAMP;

-- 2. Crear tabla login_history
CREATE TABLE login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(100),
  login_method VARCHAR(20) NOT NULL, -- 'local', 'google'
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL, -- 'success', 'failed'
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_login_history_user_id ON login_history(user_id);
CREATE INDEX idx_login_history_created_at ON login_history(created_at DESC);
CREATE INDEX idx_login_history_status ON login_history(status);

-- 3. Crear tabla tables (mesas)
CREATE TABLE tables (
  id SERIAL PRIMARY KEY,
  number VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50),
  capacity INTEGER DEFAULT 4,
  position_x INTEGER,
  position_y INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_tables_is_active ON tables(is_active);

-- 4. Ampliar enum de orders.status
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'assigned', 'in_progress', 'ready_to_deliver', 'delivered', 'paid', 'cancelled'));

ALTER TABLE orders
  ADD COLUMN cancel_reason TEXT,
  ADD COLUMN table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL;

CREATE INDEX idx_orders_table_id ON orders(table_id);
```

2. **Aplicar migración** en server:
```bash
ssh server-root
cd /data/nanlomo
# Hacer backup antes
docker exec postgres-development pg_dump -U postgres NANOLOMOS > backup-pre-migration.sql
# Aplicar SQL
docker exec -i postgres-development psql -U postgres -d NANOLOMOS < 0001_auth_and_tables.sql
```

3. **Actualizar schema.prisma** localmente:
```bash
cd backend
npm run prisma:pull  # Re-introspect para actualizar schema
npm run prisma:generate
```

### 3.2 Módulo Auth (backend)

Portar desde `Log-In/backend/src/auth/` (NestJS) → Express:

**Archivos a crear:**

- `backend/src/modules/auth/auth.routes.ts` — Rutas Express
- `backend/src/modules/auth/auth.service.ts` — Lógica: login, register, verify, refresh, reset
- `backend/src/modules/auth/auth.controller.ts` — Handlers
- `backend/src/modules/auth/strategies/` — Passport: `local.strategy.ts`, `jwt.strategy.ts`, `google.strategy.ts`
- `backend/src/middleware/requireAuth.ts` — Middleware para proteger rutas
- `backend/src/middleware/requireRole.ts` — `requireRole('manager', 'cook')`

**Endpoints objetivo:**

- `POST /api/auth/register` — Crear usuario (admin crea staff)
- `POST /api/auth/login` — Login email+password → access + refresh token
- `POST /api/auth/refresh` — Renovar access token
- `POST /api/auth/logout` — Invalidar refresh token
- `GET /api/auth/me` — Datos del usuario logueado
- `GET /api/auth/google` — Iniciar OAuth Google
- `GET /api/auth/google/callback` — Callback OAuth
- `POST /api/auth/verify-email` — Confirmar email
- `POST /api/auth/forgot-password` — Enviar email reset
- `POST /api/auth/reset-password` — Cambiar password

### 3.3 Módulo Auth (frontend)

**Páginas a crear:**

- `frontend/app/(auth)/login/page.tsx` — Login form
- `frontend/app/(auth)/verify-email/page.tsx` — Verificación
- `frontend/app/(auth)/forgot-password/page.tsx`
- `frontend/app/(auth)/reset-password/page.tsx`

**Context/hooks:**

- `frontend/lib/auth.ts` — `useAuth()` hook, `AuthContext`
- `frontend/lib/apiClient.ts` — Fetch wrapper con JWT interceptor
- `frontend/middleware.ts` — Next.js middleware para proteger rutas

**Layouts:**

- `frontend/app/(auth)/layout.tsx` — Layout público
- `frontend/app/(protected)/layout.tsx` — Layout con navbar por rol

---

## 📋 Fase 4 — Módulos de negocio

Orden recomendado (vertical slice: backend + frontend + UI por módulo):

### 4.1 Menu (lectura)
- Backend: `GET /api/menu` (lista items activos), `GET /api/menu/:id`
- Frontend: Componente `<MenuGrid>` reutilizable (mozo usa esto para crear pedidos)

### 4.2 Menu Management (gerente ABM)
- Backend: `POST/PUT/DELETE /api/menu`, upload imagen
- Frontend: `/manager/menu` — tabla editable + formulario

### 4.3 Recipes (gerente ABM)
- Backend: `GET/POST/PUT/DELETE /api/recipes`, validar ingredientes existen
- Frontend: `/manager/recipes` — selector menu item + ingredientes + cantidades

### 4.4 Inventory (gerente)
- Backend: `GET /api/inventory`, `POST /api/inventory/transactions` (ingreso/ajuste)
- Frontend: `/manager/inventory` — lista ingredientes con alertas stock bajo

### 4.5 Tables (gerente ABM)
- Backend: `GET/POST/PUT/DELETE /api/tables`
- Frontend: `/manager/tables` — CRUD + vista drag-drop para posicionar

### 4.6 Orders (mozo crea)
- Backend: `POST /api/orders` (crear), `GET /api/orders?status=pending` (lista)
- Frontend: `/waiter` — mapa de mesas + modal crear pedido

### 4.7 Kitchen (cocinero workflow)
- Backend: 
  - `GET /api/kitchen/queue` (pedidos sin asignar)
  - `GET /api/kitchen/my-orders` (pedidos del cocinero)
  - `PATCH /api/kitchen/orders/:id/take` (auto-asignar)
  - `PATCH /api/kitchen/orders/:id/start`
  - `PATCH /api/kitchen/orders/:id/complete`
- Frontend: `/cook` — kanban (cola, en curso, listos)

### 4.8 Waiter Checkout (mozo cobra)
- Backend: 
  - `PATCH /api/orders/:id/deliver`
  - `PATCH /api/orders/:id/pay` (marca pagado, descuenta stock real)
- Frontend: `/waiter` — acción "Cobrar" por mesa

### 4.9 Reports (gerente)
- Backend: 
  - `GET /api/reports/daily` (recaudación del día)
  - `GET /api/reports/purchase-projection` (ingredientes a comprar)
  - `GET /api/reports/top-items`
- Frontend: `/manager/reports` — gráficos Recharts

### 4.10 WebSocket (real-time)
- Backend: `backend/src/ws/socketHandler.ts` — rooms por rol, eventos:
  - `order:created` (cocina + gerente)
  - `order:updated` (todos)
  - `order:completed` (mozo + gerente)
- Frontend: `frontend/lib/socketClient.ts` — hook `useSocket()`

---

## 📋 Fase 5 — Monitoring

Copiar `Log-In/monitoring/` tal cual:

```bash
cp -r ../Log-In/monitoring .
```

Adaptar `monitoring/promtail/promtail-config.yml`:
- Cambiar paths de logs a `/var/log/nanlomo-*.log`

Levantar stack:
```bash
cd monitoring
docker compose up -d
```

Dashboard Grafana: http://192.168.100.35:3001 (admin/admin)

---

## ⚙️ Deploy completo

Cuando tengas auth + al menos 1 módulo de negocio funcionando:

1. **Commit + push a main**:
```bash
git add .
git commit -m "feat: auth + menu modules"
git push origin main
```

2. **GitHub Actions** buildea + sube a DockerHub + despliega automáticamente.

3. **Activar nginx** en server:
```bash
ssh server-root
mv /data/repositorios/nginx/conf/nanlomo.conf.disabled /data/repositorios/nginx/conf/nanlomo.conf
docker exec nginx-central nginx -t
docker exec nginx-central nginx -s reload
```

4. **Acceder**: https://nanolomos.cals.com.ar

---

## 🔑 Pendiente que me pases:

1. **SMTP password** (Gmail app password) → actualizar en `/data/nanlomo/.env`
2. **Google OAuth credentials** → crear en [Google Cloud Console](https://console.cloud.google.com/apis/credentials) y poner en `.env`

---

## 📚 Recursos útiles

- [Prisma docs](https://www.prisma.io/docs/)
- [Next.js docs](https://nextjs.org/docs)
- [Passport.js strategies](http://www.passportjs.org/packages/)
- [Socket.io docs](https://socket.io/docs/v4/)

---

_Creado: 2026-04-30 — Fase 2 scaffolding_
