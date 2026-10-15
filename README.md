# Nano Lomos Restaurant Management System

Sistema de gestión interna para restaurante de comida rápida. Controla pedidos, inventario, cocina y estadísticas.

## Stack

- **Backend**: Node.js + Express + TypeScript + Prisma + PostgreSQL
- **Frontend**: Next.js 14 + React + TypeScript + Tailwind CSS  
- **Auth**: JWT + Google OAuth + email verification
- **Real-time**: Socket.io (pedidos y cocina)
- **Monitoring**: Grafana + Loki + Prometheus
- **Deploy**: Docker + GitHub Actions

## Estructura

```
restaurante/
├── backend/               # API Express + TypeScript
│   ├── src/
│   │   ├── modules/       # Auth, Users, Menu, Orders, Kitchen, etc.
│   │   ├── middleware/    # JWT, roles, error handling
│   │   ├── lib/           # Prisma, logger, utils
│   │   └── ws/            # WebSocket handlers
│   └── prisma/            # Schema + migrations
├── frontend/              # Next.js app
│   └── app/
│       ├── (auth)/        # Login, verify
│       ├── manager/       # Dashboard, menu, inventory, reports
│       ├── cook/          # Kitchen queue
│       └── waiter/        # Orders, tables
├── docker/                # Dockerfiles + nginx config
├── monitoring/            # Grafana stack
├── scripts/               # Backup/restore
└── specs/                 # Docs (PROMPT, MIGRATION_PLAN)
```

## Quick Start (Desarrollo)

### Requisitos
- Node.js 20+
- PostgreSQL (DB NANOLOMOS en 192.168.100.35:5433)
- npm o pnpm

### Setup

1. Configurar variables:
```bash
cp .env.example .env
# Editar .env con tus valores (DB, JWT secrets, Google OAuth, SMTP)
```

2. Backend:
```bash
cd backend
npm install
npm run prisma:generate
npm run dev
```

3. Frontend:
```bash
cd frontend
npm install
npm run dev
```

4. Acceder:
- Frontend: http://localhost:3000
- Backend API: http://localhost:3002/api
- Health: http://localhost:3002/api/health

## Producción (andres-server)

Deploy en `192.168.100.35:/data/nanlomo/`  
Dominio: https://nanolomos.cals.com.ar

### Deploy manual

```bash
./deploy.ps1    # Windows
./deploy.sh     # Linux/Mac
```

### Deploy automático

Push a `main` → GitHub Actions → build + deploy

## Roles y URLs

- **Manager**: `/manager` — Dashboard, menú, inventario, reportes, usuarios, mesas
- **Cook**: `/cook` — Cola de pedidos, marcar estados  
- **Waiter**: `/waiter` — Tomar pedidos, mesas, cobrar

## Base de Datos

La DB `NANOLOMOS` ya existe con **datos reales**:
- 29 items de menú
- 27 ingredientes
- 148 recetas

**Backup pre-migración**: `/data/backups/nanolomos-backup-20260430-*.dump`

## Documentación

- [specs/PROMPT.md](specs/PROMPT.md) — Especificación del negocio
- [specs/MIGRATION_PLAN.md](specs/MIGRATION_PLAN.md) — Plan de migración
- [legacy/](legacy/) — Código anterior (Express+React v0)

## Estado Actual

**Fase 2 completa** ✅ Scaffolding terminado:
- ✅ Estructura backend/frontend
- ✅ Prisma schema generado desde DB
- ✅ Dockerfiles adaptados
- ✅ .env configurado (server + local)
- ✅ nginx.conf listo (server:/data/repositorios/nginx/conf/nanlomo.conf.disabled)

**Próximos pasos** (Fase 3+4):
- [ ] Migración Prisma (ALTER users + tabla tables + login_history)
- [ ] Auth module (JWT + Google OAuth + email)
- [ ] Módulos de negocio (menu, orders, kitchen, etc.)
- [ ] Frontend UI (login + dashboards por rol)
- [ ] WebSocket real-time
- [ ] Monitoring stack

## License

MIT
# Sistema de Gestión de Restaurante

Sistema web para gestión interna de restaurante: pedidos, cocina, inventario y reportes.

## 🎯 Estado Actual del Proyecto

**Fecha**: 2026-02-09  
**Branch**: `001-restaurant-system`

### ✅ Completado

#### Phase 1: Setup (T001-T011) - 100%
- ✅ Estructura de proyecto (backend/ y frontend/)
- ✅ Configuración de Node.js y dependencias instaladas
- ✅ ESLint y Prettier configurados
- ✅ Variables de entorno (.env) configuradas
- ✅ Tailwind CSS configurado en frontend
- ✅ Vite configurado para React

#### Phase 2: Foundational (T012-T057) - 100%
- ✅ Base de datos **NANOLOMOS** creada en PostgreSQL
- ✅ 10 migraciones ejecutadas:
  - users, menu_items, ingredients, customers, recipes
  - orders, order_lines, stock_transactions
  - indexes para performance
  - triggers para lógica de negocio
- ✅ Seeds ejecutados:
  - 5 usuarios (admin, 2 cocineros, 2 tomadores de pedidos)
  - 7 items de menú
  - 18 ingredientes
  - 5 clientes de ejemplo
  - 19 recetas con instrucciones
- ✅ Modelos: User, Customer
- ✅ Servicios: AuthService completo (bcrypt + JWT)
- ✅ Middleware: auth, roleCheck, errorHandler
- ✅ Routes: /api/auth/login, /api/auth/me
- ✅ WebSocket: Socket.IO configurado con autenticación
- ✅ Servidor Express funcionando en puerto 3002
- ✅ Logger Winston configurado

### ⏳ En Progreso

#### Phase 3: User Story 1 - Gestión de Pedidos (T058-T083)
**Status**: Iniciando  
**Objetivo**: Tomadores de pedidos pueden crear pedidos con items del menú

### 📋 Pendiente

- Phase 4: US2 - Gestión de Cocina (T084-T108)
- Phase 5: US3 - Dashboard Gerencial (T109-T135)
- Phase 6: US4 - Control de Inventario (T136-T158)
- Phase 7: Polish & Cross-Cutting (T159-T212)

## 🚀 Cómo Ejecutar

### Backend

```bash
cd backend
npm install
npm start
```

Backend disponible en: `http://localhost:3002`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend disponible en: `http://localhost:3000`

### Base de Datos

**Servidor**: 192.168.100.35:5433  
**Base de Datos**: NANOLOMOS  
**Usuario**: postgres  
**Password**: dev1234

Para recrear la base de datos:
```bash
cd backend
node src/database/create-database.js
node src/database/seeds/index.js
```

## 👥 Usuarios de Prueba

| Usuario | Contraseña | Rol |
|---------|-----------|-----|
| admin | admin123 | manager |
| cocinero1 | cocina123 | cook (María García) |
| cocinero2 | cocina123 | cook (Carlos Rodríguez) |
| pedidos1 | pedidos123 | order_taker (Ana Martínez) |
| pedidos2 | pedidos123 | order_taker (Luis Fernández) |

## 📊 Endpoints Disponibles

### Autenticación
- `POST /api/auth/login` - Login y obtención de JWT token
- `GET /api/auth/me` - Información del usuario autenticado (requiere token)

### Health Check
- `GET /health` - Verificar estado del servidor

## 🛠️ Tecnologías

**Backend**:
- Node.js 18+ con Express.js
- PostgreSQL 14+
- Socket.IO (WebSocket)
- JWT para autenticación
- bcrypt para passwords (10 rounds)
- Winston para logging

**Frontend**:
- React 18+
- Vite como build tool
- Tailwind CSS para estilos
- React Router para navegación
- Axios para HTTP
- Socket.IO client para tiempo real

## 📦 Estructura del Proyecto

```
backend/
├── src/
│   ├── database/
│   │   ├── migrations/     # 10 migraciones SQL
│   │   └── seeds/          # Datos iniciales
│   ├── models/             # User, Customer
│   ├── services/           # authService
│   ├── routes/             # auth routes
│   ├── middleware/         # auth, roleCheck, errorHandler
│   ├── websocket/          # socketHandler
│   ├── utils/              # logger, validators
│   └── server.js           # Entry point
├── logs/                   # Winston logs
└── package.json

frontend/
├── src/
│   ├── components/         # React components
│   ├── pages/              # Vistas por rol
│   ├── services/           # API clients
│   ├── context/            # React Context
│   ├── hooks/              # Custom hooks
│   ├── utils/              # Utilidades
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css           # Tailwind base
└── package.json

specs/
└── 001-restaurant-system/
    ├── spec.md             # 38 functional requirements
    ├── plan.md             # Technical architecture
    ├── tasks.md            # 221 tasks
    ├── data-model.md       # 8 tables
    ├── contracts/
    │   └── openapi.yaml    # API specification
    ├── research.md
    └── quickstart.md
```

## 📝 Próximos Pasos

1. **Implementar User Story 1** (T058-T083):
   - Modelos: MenuItem, Order, OrderLine
   - Servicios: orderService, menuService
   - Rutas: /api/orders, /api/menu
   - Frontend: Componentes para crear pedidos
   - Validación de stock antes de crear pedidos (FR-024)
   - Asignación manual por order_taker (FR-006A, FR-006B)

2. **Implementar User Story 2** (T084-T108):
   - kitchenService con algoritmo FIFO
   - Vista de cocinero con pedido asignado
   - Instrucciones de preparación visibles

3. **Implementar Dashboard Gerencial** (US3)
4. **Implementar Control de Inventario** (US4)
5. **Polish y optimización final**

## 🔒 Seguridad

- ✅ Contraseñas hasheadas con bcrypt (10 rounds)
- ✅ JWT tokens con expiración de 30 minutos
- ✅ Middleware de autenticación en todas las rutas protegidas
- ✅ Role-based access control (RBAC)
- ✅ Helmet.js para headers de seguridad
- ✅ CORS configurado

## 📄 Licencia

ISC
