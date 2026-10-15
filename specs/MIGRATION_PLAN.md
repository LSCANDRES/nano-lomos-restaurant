# Plan de migración — NanLomo rebuild

> Hoja de ruta para llevar el proyecto del estado actual (Express+React+Vite+SQL crudo, parcial) al stack objetivo (Express+TS+Prisma+Next.js, basado en `Estructura/` + auth de `Log-In/`).

---

## 1. Estado actual auditado

### 1.1 Base de datos `NANOLOMOS` (postgres-development, 5433)
| Tabla | Filas | Acción |
|---|---|---|
| `users` | pocos (test) | **Conservar + ALTER** (agregar email, provider, google_id, is_email_verified, avatar_url) |
| `menu_items` | 29 | **Conservar tal cual** |
| `ingredients` | 27 | **Conservar tal cual** |
| `recipes` | 148 | **Conservar tal cual** ⭐ (es el mayor activo) |
| `customers` | 5 | Conservar |
| `orders` | 4 (test) | **Truncar** y agregar estados nuevos al CHECK |
| `order_lines` | 6 (test) | **Truncar** |
| `stock_transactions` | 0 | OK |

**Tablas nuevas**: 
- `login_history` (auditoría auth).
- `tables` (mesas configurables: number, name, capacity, position para mapa, is_active).

### 1.2 Código en `restaurante/`
| Carpeta / archivo | Decisión |
|---|---|
| `backend/src/database/migrations/*.sql` | **Archivar** en `legacy/sql/` como referencia. Nuevo schema vivirá en Prisma. |
| `backend/src/database/seeds/` | **Archivar** (los datos ya están en la DB). |
| `backend/src/services/*.js` | **Portar lógica** (no copiar archivos) a TS+Prisma en módulos nuevos. |
| `backend/src/models/*.js` | **Tirar** (Prisma genera tipos). |
| `backend/src/routes/*.js` | **Tirar** (Express+TS reescribe). Mantener nombres de endpoints como referencia. |
| `backend/src/websocket/socketHandler.js` | **Portar** patrón a TS, usar Socket.io. |
| `backend/src/middleware/*` | **Portar** auth a Passport+JWT, errorHandler, upload (multer). |
| `backend/*.js` (scripts sueltos: `activate-user`, `reset-passwords`, `test-*`) | **Tirar** (one-off scripts viejos). |
| `backend/Dockerfile` | **Reemplazar** por `Estructura/docker/Dockerfile.backend`. |
| `frontend/` (React+Vite) | **Tirar entero**. Reemplazar por Next.js de `Estructura/`. |
| `frontend/src/components/common/*` | Rescatar diseño (Logo, Button, Card, Toast) como referencia visual. |
| `frontend/STYLE_RULES.md` | **Conservar** (reglas de estilo del negocio). |
| `frontend/public/images/menu/` | **Conservar** y mover a `public/uploads/menu/` del nuevo front. |
| `backend/public/uploads/menu-items/` | **Conservar** y migrar al volumen del backend nuevo. |
| `docker/docker-compose.yml` | **Reemplazar** por los de `Estructura/docker/`. |
| `docker/build.*`, `deploy*.sh` | **Tirar**. Usar workflows de `Estructura/.github/`. |
| `docker/nginx/nanlomo.conf` | **Conservar**. Ya está en server como `.disabled`, solo renombrar al deploy. |
| `docs/`, `specs/`, `TASKS.MD`, `COMO_USAR_*.md`, `FLUJO_*.md` | Conservar `specs/`. Archivar el resto en `legacy/docs/`. |

---

## 2. Estructura objetivo

```
restaurante/
├── .env.example                 ← copiado de Estructura, adaptado
├── .gitignore
├── README.md                    ← reescribir corto
├── deploy.sh / deploy.ps1       ← de Estructura
├── backend/                     ← Express + TS + Prisma (de Estructura)
│   ├── Dockerfile               ← borrar (vive en docker/)
│   ├── package.json
│   ├── tsconfig.json
│   ├── prisma/
│   │   ├── schema.prisma        ← generado con `prisma db pull` + ajustes
│   │   ├── migrations/          ← baseline + nuevas migraciones (login_history, ALTERs)
│   │   └── seed.ts              ← seed de roles, admin inicial
│   └── src/
│       ├── main.ts
│       ├── app.ts
│       ├── config/
│       ├── modules/
│       │   ├── auth/            ← portado de Log-In NestJS → Express
│       │   ├── users/
│       │   ├── menu/
│       │   ├── recipes/
│       │   ├── inventory/
│       │   ├── orders/
│       │   ├── kitchen/
│       │   └── reports/
│       ├── middleware/          ← jwt, role-guard, error, upload
│       ├── ws/                  ← Socket.io rooms por rol
│       └── lib/                 ← logger (pino), prisma client, validators (zod)
├── frontend/                    ← Next.js 14 app router (de Estructura)
│   ├── Dockerfile               ← borrar (vive en docker/)
│   ├── package.json
│   ├── next.config.mjs
│   ├── tailwind.config.ts
│   └── src/
│       ├── app/
│       │   ├── (auth)/login
│       │   ├── (auth)/oauth-callback
│       │   ├── manager/         ← dashboard, menu, inventory, recipes, reports, users
│       │   ├── cook/
│       │   ├── waiter/
│       │   └── api/             ← BFF si hace falta
│       ├── components/
│       │   ├── ui/              ← (rescatar diseño del front viejo)
│       │   ├── manager/
│       │   ├── cook/
│       │   └── waiter/
│       ├── lib/                 ← apiClient, socketClient, auth helpers
│       └── styles/
├── docker/                      ← de Estructura (reemplaza el actual)
│   ├── docker-compose.yml
│   ├── docker-compose.prod.yml
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   ├── nginx/
│   │   └── nanlomo.conf         ← actual, sin cambios
│   ├── conf/                    ← de Estructura
│   └── deploy/                  ← scripts py de Estructura
├── monitoring/                  ← copiado tal cual de Log-In
│   ├── docker-compose.yml
│   ├── grafana/
│   ├── loki/
│   ├── promtail/
│   └── prometheus/
├── scripts/                     ← de Estructura (backup/restore)
├── specs/
│   ├── PROMPT.md                ← este sprint
│   ├── MIGRATION_PLAN.md        ← este sprint
│   └── 001-restaurant-system/   ← se regenera con speckit
├── legacy/                      ← carpeta zip-friendly con lo viejo (auto-gitignored)
│   ├── sql/
│   ├── frontend-react/
│   └── docs/
└── .github/workflows/           ← de Estructura (deploy.yml + ci.yml)
```

---

## 3. Fases de ejecución

### Fase 1 — Documentación (esta sesión) ✅
- [x] Auditoría DB y código.
- [x] `specs/PROMPT.md`.
- [x] `specs/MIGRATION_PLAN.md` (este archivo).
- [x] `docker/nginx/nanlomo.conf` ya alineado con server.

### Fase 2 — Scaffolding (próxima sesión)
1. Mover código actual a `legacy/` (mv frontend → legacy/frontend-react, etc.).
2. Copiar plantilla de `Estructura/` → reemplazar placeholders (`MI_APP=nanlomo`, `MI_DOMINIO=nanolomos.cals.com.ar`, `MI_DB=NANOLOMOS`, `DOCKER_USER=mambru94`, puerto backend `3002`).
3. `prisma db pull` contra `NANtables.sql`: ALTER users + crear login_history + crear tables + ampliar enum de orders.statu
4. Migración Prisma `0001_baseline.sql` (vacío, marca el estado actual).
5. Migración Prisma `0002_auth_fields.sql`: ALTER users + crear login_history + ampliar enum de orders.

### Fase 3 — Auth + Monitoring
6. Portar AuthModule de `Log-In/backend/src/auth/` (NestJS) → Express+Passport: `local`, `jwt`, `google` strategies + refresh tokens.
7. Middlewares: `requireAuth`, `requireRole(...roles)`, `attachUser`.
8. Endpoints: `POST /api/auth/login`, `POST /api/auth/refresh`, `POST /api/auth/logout`, `GET /api/auth/google`, `GET /api/auth/google/callback`, `GET /api/auth/me`.
9. Frontend: páginas `/login`, layout protegido por rol, interceptor JWT.
10. Copiar `monitoring/` de Log-In tal cual y adaptar `promtail` para apuntar a logs del backend nuevo.

### Fase 4 — Negocio (vertical slice por módulo)
Orden recomendado, cada uno con backend + frontend + tests humo:
1. **Menu** (lectura, ya hay 29 items) — vista pública del staff + ABM gerente.
2. **Inventory** + **Recipes** (lectura, ya hay datos) — vista gerente.
3. **Orders create + list** (mozo crea, todos ven cola).
4. **Kitchen flow** (cocinero toma/avanza estados, WS).
5. **Waiter checkout** (cobrar, cierre mesa).
6. **Reports** + proyección de compras.
7. **Users management** (gerente).

---

## 4. Rollback / seguridad

- Antes de cualquier ALTER en `NANOLOMOS`: `pg_dump` de la DB completa a `/data/backups/nanolomos-pre-rebuild-$(date +%F).sql`.
- Mantener `legacy/` en el repo (no commitear si es muy grande, pero conservar local).
- Workflow de deploy con `kubectl rollout undo` o `docker compose down && docker compose up -d` con tag previo si rompe.

---

## 5. Decisiones tomadas

1. **Mesas**: **Configurables por gerente**. Agregar tabla `tables` con `id`, `number`, `name`, `capacity`, `is_active`, `position_x`, `position_y` (para mapa visual en vista mozo). ABM en módulo manager.

2. **SMTP**: **Gmail con app password** (como en padel-profe). Variables: `SMTP_HOST=smtp.gmail.com`, `SMTP_PORT=587`, `SMTP_USER`, `SMTP_PASS`. Activar verify email + reset password (opcionales en login, no bloqueantes).

3. **Multi-tenant**: **NO** por ahora (un solo local). Si abren sucursal, nueva DB o migración posterior.

4. **Legacy**: Conservar carpeta `legacy/` en repo hasta fin de Fase 4, luego archivar en rama `archive/v0-legacy` y borrar de main.

5. **Cocineros simultáneos**: Asumimos 2-4 (vista kanban en cook/). Sin límite hard en DB.
