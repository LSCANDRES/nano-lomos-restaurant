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
