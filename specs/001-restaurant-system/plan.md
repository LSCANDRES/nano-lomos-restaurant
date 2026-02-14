# Implementation Plan: Sistema de Gestión de Restaurante

**Branch**: `001-restaurant-system` | **Date**: 2026-02-08 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/001-restaurant-system/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Sistema web interno para restaurante que gestiona pedidos en cola, asignación automática a cocineros, tracking de tiempos, cálculo de recaudación e inventario en tiempo real. Implementado con arquitectura cliente-servidor: backend Node.js con Express/REST API, frontend React.js, base de datos PostgreSQL. Sistema diseñado para red local del restaurante con 3 roles de usuario (Gerente, Cocinero, Tomador de Pedidos).

## Technical Context

**Language/Version**: 
  - Backend: Node.js 18+ with JavaScript/ES6+
  - Frontend: React 18+ with JavaScript/JSX
  
**Primary Dependencies**:
  - Backend: Express.js (REST API), pg (PostgreSQL client), socket.io (WebSocket), bcrypt (auth - 10 rounds), jsonwebtoken (sessions)
  - Frontend: React Router (navigation), axios (HTTP client), socket.io-client (real-time), Tailwind CSS (styling)
  
**Storage**: PostgreSQL 14+ 
  - Host: 192.168.100.35:5433
  - Database: Relational schema with tables for Orders, MenuItems, Users, Ingredients, Recipes, OrderLines
  - Migrations using node-pg-migrate or Sequelize migrations
  
**Testing**: 
  - Backend: Jest + Supertest (API testing)
  - Frontend: Jest + React Testing Library
  - E2E: Playwright or Cypress
  
**Target Platform**: 
  - Deployment: Red local del restaurante (LAN)
  - Backend: Puerto 3002
  - Frontend: http://localhost:3000
  - Acceso desde múltiples dispositivos (PCs, tablets) en la red local
  
**Project Type**: Web application (frontend + backend separated)

**Performance Goals**:
  - API response time: < 500ms para operaciones comunes (GET orders, POST order)
  - API request timeout: 10 segundos
  - WebSocket latency: < 3s para actualizaciones en tiempo real (desde evento backend hasta render frontend)
  - WebSocket reconnection: Auto-reconnect con exponential backoff (max 3 intentos)
  - Soportar 50+ pedidos concurrentes en cola sin degradación
  - Frontend render: Initial load < 2s, route changes < 300ms
  
**Constraints**:
  - Red local únicamente (no internet requerido para funcionar)
  - Múltiples usuarios simultáneos (3-10 usuarios concurrentes)
  - Contraseñas: Mínimo 8 caracteres, bcrypt con 10 rounds
  - Sesiones: Timeout de 30 minutos de inactividad
  - Asignación de pedidos: FIFO (First-In-First-Out) - pedido más antiguo al primer cocinero disponible
  - Sin necesidad de escalabilidad cloud, enfocado en red LAN
  - Base de datos centralizada en 192.168.100.35
  
**Scale/Scope**:
  - 3-10 usuarios simultáneos
  - ~100-200 pedidos por día
  - Menú con 20-50 items aproximadamente
  - ~30-50 ingredientes en inventario
  - 3 roles de usuario con permisos diferenciados

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **PASSED** - No constitution principles defined yet for this project. No violations to check.

**Post-Phase 1 Re-evaluation**: Architecture and design completed. No complexity concerns identified. Standard web application patterns used throughout.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/              # Sequelize models o clases de dominio
│   │   ├── Order.js        # Modelo de Pedido
│   │   ├── MenuItem.js     # Modelo de Item de Menú
│   │   ├── User.js         # Modelo de Usuario
│   │   ├── Ingredient.js   # Modelo de Ingrediente
│   │   ├── Recipe.js       # Modelo de Receta (relación MenuItem-Ingredient)
│   │   └── OrderLine.js    # Modelo de Línea de Pedido
│   ├── services/            # Lógica de negocio
│   │   ├── orderService.js     # Gestión de cola de pedidos
│   │   ├── kitchenService.js   # Asignación automática a cocineros
│   │   ├── inventoryService.js # Control de inventario
│   │   ├── reportService.js    # Generación de reportes
│   │   └── authService.js      # Autenticación y autorización
│   ├── routes/              # Definición de endpoints REST
│   │   ├── orders.js       # POST /orders, GET /orders, PUT /orders/:id
│   │   ├── menu.js         # GET /menu, POST /menu, PUT /menu/:id
│   │   ├── kitchen.js      # GET /kitchen/assigned, PUT /kitchen/complete
│   │   ├── users.js        # POST /auth/login, GET /users
│   │   ├── inventory.js    # GET /inventory, POST /inventory/restock
│   │   └── reports.js      # GET /reports/daily, GET /reports/revenue
│   ├── middleware/          # Express middleware
│   │   ├── auth.js         # JWT validation
│   │   ├── roleCheck.js    # Role-based access control
│   │   └── errorHandler.js # Manejo de errores
│   ├── database/            # Configuración de PostgreSQL
│   │   ├── connection.js   # Pool de conexiones pg
│   │   ├── migrations/     # Scripts de migración de schema
│   │   └── seeds/          # Datos iniciales (menú ejemplo, usuarios)
│   ├── websocket/           # WebSocket para actualizaciones en tiempo real
│   │   └── socketHandler.js # Eventos: new-order, order-completed, etc.
│   ├── utils/               # Utilidades
│   │   ├── logger.js       # Winston logger
│   │   └── validators.js   # Validaciones de input
│   └── server.js            # Entry point de Express app
├── tests/
│   ├── unit/                # Tests unitarios de services
│   ├── integration/         # Tests de API endpoints
│   └── e2e/                 # Tests end-to-end
├── package.json
├── .env.example
└── README.md

frontend/
├── src/
│   ├── components/          # Componentes React reutilizables
│   │   ├── common/         # Button, Input, Modal, Card, etc.
│   │   ├── orders/         # OrderList, OrderCard, OrderForm
│   │   ├── menu/           # MenuDisplay, MenuItemCard
│   │   └── dashboard/      # StatsCard, Chart, RealtimeUpdate
│   ├── pages/               # Vistas principales por rol
│   │   ├── Login.jsx       # Autenticación
│   │   ├── OrderTaker/     # Vista para tomar pedidos
│   │   │   ├── OrderTakerDashboard.jsx
│   │   │   └── CreateOrder.jsx
│   │   ├── Cook/           # Vista para cocineros
│   │   │   ├── CookDashboard.jsx
│   │   │   └── AssignedOrder.jsx
│   │   └── Manager/        # Dashboard gerencial
│   │       ├── ManagerDashboard.jsx
│   │       ├── InventoryView.jsx
│   │       └── ReportsView.jsx
│   ├── services/            # Llamadas a API
│   │   ├── api.js          # Axios instance configurado
│   │   ├── orderService.js # API calls para pedidos
│   │   ├── menuService.js  # API calls para menú
│   │   ├── authService.js  # API calls para auth
│   │   └── socket.js       # Socket.io client setup
│   ├── context/             # React Context para state global
│   │   ├── AuthContext.jsx # Usuario autenticado, rol
│   │   └── OrderContext.jsx # Estado de pedidos en tiempo real
│   ├── hooks/               # Custom hooks
│   │   ├── useAuth.js      # Hook para autenticación
│   │   ├── useSocket.js    # Hook para WebSocket
│   │   └── useOrders.js    # Hook para gestión de pedidos
│   ├── utils/               # Helpers
│   │   ├── formatters.js   # Formateo de fechas, moneda
│   │   └── constants.js    # Constantes (estados de pedido, roles)
│   ├── App.jsx              # Router y layout principal
│   └── index.jsx            # Entry point
├── public/
│   └── index.html
├── tests/
│   ├── components/          # Tests de componentes
│   └── integration/         # Tests de integración
├── package.json
└── README.md

docs/
├── api/                     # Documentación de API (OpenAPI/Swagger)
│   └── openapi.yaml
├── setup/                   # Guías de instalación
│   ├── database-setup.md   # Setup PostgreSQL
│   └── deployment.md       # Deploy en red local
└── user-guides/             # Manuales de usuario
    ├── manager-guide.md
    ├── cook-guide.md
    └── order-taker-guide.md
```

**Structure Decision**: Se eligió arquitectura web con separación completa backend/frontend para:
- Despliegue flexible: backend como servicio en servidor central, frontend accesible desde múltiples dispositivos
- Escalabilidad: agregar más clientes frontend sin afectar backend
- Comunicación en tiempo real vía WebSocket para actualizaciones instantáneas de pedidos
- Separación de responsabilidades: lógica de negocio en backend, UI/UX en frontend
- Testing independiente de cada capa
- Desarrollo paralelo: equipos pueden trabajar en backend y frontend simultáneamente

## Complexity Tracking

No complexity violations detected. Architecture follows standard patterns for web applications.
