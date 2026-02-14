# Phase 0: Research & Technical Decisions

**Feature**: Sistema de Gestión de Restaurante  
**Branch**: `001-restaurant-system`  
**Date**: 2026-02-08

## Technology Stack Decisions

### Backend Framework: Node.js + Express.js

**Decision**: Use Node.js 18+ with Express.js framework

**Rationale**:
- JavaScript full-stack permite compartir código entre frontend y backend (validaciones, constantes)
- Express.js es maduro, bien documentado, y tiene ecosistema grande de middleware
- Excelente para APIs REST y WebSocket (socket.io)
- Non-blocking I/O es perfecto para operaciones concurrentes (múltiples pedidos simultáneos)
- Fácil integración con PostgreSQL vía librería `pg`

**Alternatives Considered**:
- **NestJS**: Más estructurado pero añade complejidad innecesaria para este scope. Express es suficiente y más directo.
- **Python FastAPI**: Excelente performance pero equipo tendría que aprender Python. JavaScript mantiene consistencia.
- **PHP Laravel**: Maduro para web apps pero menos ideal para WebSocket real-time features.

### Frontend Framework: React.js

**Decision**: Use React 18+ con JavaScript/JSX

**Rationale**:
- Component-based architecture perfecta para reutilizar UI (OrderCard, MenuItemCard, etc.)
- Virtual DOM proporciona renders eficientes para actualizaciones en tiempo real
- Ecosistema maduro: React Router (navegación), Material-UI/Tailwind (styling)
- Hooks permiten lógica reutilizable (useAuth, useSocket, useOrders)
- Gran comunidad y documentación

**Alternatives Considered**:
- **Vue.js**: Más simple de aprender pero React tiene mejor soporte para aplicaciones enterprise-scale
- **Svelte**: Performance excelente pero ecosistema más pequeño, menos librerías disponibles
- **Vanilla JS**: Demasiado código boilerplate para manejar estado complejo y routing

### Database: PostgreSQL

**Decision**: PostgreSQL 14+ en host 192.168.100.35:5433

**Rationale**:
- RDBMS robusto, ideal para relaciones complejas (Orders ↔ OrderLines ↔ MenuItems ↔ Recipes ↔ Ingredients)
- ACID compliance garantiza integridad de datos críticos (pedidos, inventario, recaudación)
- Excellent support para transacciones (necesario para operaciones de inventario)
- JSON support para metadata flexible (modificaciones especiales en pedidos)
- Free y open-source, infraestructura ya disponible

**Alternatives Considered**:
- **MySQL**: Similar a PostgreSQL pero menos features avanzados (JSON support limitado)
- **MongoDB**: NoSQL sería más simple inicialmente pero pierde ventajas de relaciones y transacciones ACID necesarias para inventario
- **SQLite**: Demasiado simple para concurrencia requerida (múltiples usuarios simultáneos)

### Real-Time Communication: Socket.io

**Decision**: Use socket.io para actualizaciones en tiempo real

**Rationale**:
- WebSocket bidireccional permite push de actualizaciones desde servidor a clientes
- Fallback automático a long-polling si WebSocket no disponible
- Room support perfecto para separar channels (kitchen-updates, manager-dashboard)
- Reconexión automática si hay pérdida de conexión
- Integración simple con Express.js

**Alternatives Considered**:
- **Server-Sent Events (SSE)**: Unidireccional (solo servidor → cliente), insuficiente para nuestras necesidades
- **Polling periódico**: Ineficiente, genera carga innecesaria, latencia más alta
- **Native WebSocket**: Requiere más código manual, socket.io abstrae complejidad

### Authentication: JWT (JSON Web Tokens)

**Decision**: JWT con bcrypt para hash de contraseñas

**Rationale**:
- Stateless authentication, no requiere sesiones en servidor
- Token se envía en cada request (Authorization header)
- Payload incluye: user_id, role, exp (expiration)
- bcrypt es estándar industry para password hashing (salt + hash)
- Fácil implementar con jsonwebtoken library

**Alternatives Considered**:
- **Session-based (cookies)**: Requiere almacenar sesiones en servidor o Redis, más complejo para arquitectura sin estado
- **OAuth2**: Overkill para sistema interno, no hay third-party providers requeridos
- **Passport.js**: Buena librería pero JWT directo es más simple para este caso

## Best Practices Research

### Database Schema Design

**Pattern**: Normalized relational schema con tablas de union

**Key Tables**:
- `users`: id, username, password_hash, role, full_name, active
- `menu_items`: id, name, description, price, active
- `ingredients`: id, name, unit, current_stock, min_stock, cost_per_unit
- `recipes`: menu_item_id, ingredient_id, quantity_needed (junction table)
- `orders`: id, created_at, status, assigned_cook_id, started_at, completed_at, total_amount
- `order_lines`: order_id, menu_item_id, quantity, unit_price, notes

**Migrations**: Use `node-pg-migrate` para versionado de schema

### API Design Patterns

**RESTful Principles**:
- `GET /api/orders` - List orders (filterable by status)
- `POST /api/orders` - Create new order
- `GET /api/orders/:id` - Get order details
- `PUT /api/orders/:id/status` - Update order status
- `POST /api/auth/login` - Authenticate user
- `GET /api/menu` - Get menu items
- `GET /api/reports/daily` - Get daily revenue

**Status Codes**:
- 200 OK - Successful GET/PUT
- 201 Created - Successful POST
- 400 Bad Request - Validation errors
- 401 Unauthorized - Missing/invalid token
- 403 Forbidden - Insufficient permissions
- 404 Not Found - Resource doesn't exist
- 500 Internal Server Error - Server errors

### Frontend State Management

**Pattern**: React Context + Local State

**Rationale**:
- Context para estado global: AuthContext (usuario actual, token), OrderContext (pedidos en tiempo real)
- Local state (useState) para estado de componentes específicos
- Custom hooks encapsulan lógica: useAuth, useSocket, useOrders
- No necesitamos Redux debido a scope limitado

### Error Handling Strategy

**Backend**:
- Try-catch en async/await para capturar errores
- Error middleware centralizado en Express
- Logging con Winston (console + file)
- Structured error responses: `{ error: { message, code, details } }`

**Frontend**:
- Error boundaries para errores de React
- Toast notifications para feedback de usuario
- Retry logic para requests fallidos
- Fallback UI cuando hay errores

### Security Considerations

**Backend Security**:
- CORS configurado para solo permitir frontend origin
- Helmet.js para HTTP headers seguros
- Rate limiting en endpoints sensibles (login)
- Input sanitization y validation
- Password hashing con bcrypt (salt rounds: 10)
- JWT expiration: 8 horas (workday)

**Frontend Security**:
- Token almacenado en memory (no localStorage por XSS)
- Refresh strategy por timeout de inactividad
- Form validation antes de enviar a backend
- Sanitize user input para evitar XSS

## Integration Patterns

### WebSocket Event Flow

**Events from Server**:
- `order:created` - Nuevo pedido en cola
- `order:assigned` - Pedido asignado a cocinero
- `order:completed` - Pedido marcado como completado
- `inventory:low-stock` - Ingrediente bajo stock mínimo
- `stats:update` - Actualización de estadísticas dashboard

**Events from Client**:
- `cook:available` - Cocinero disponible para recibir pedido
- `order:status-change` - Cambio de estado de pedido

**Room Strategy**:
- `kitchen` room para todos los cocineros
- `managers` room para gerentes
- `order-takers` room para tomadores de pedidos

### Database Transaction Patterns

**Critical Sections Requiring Transactions**:
1. **Complete Order**: Update order status + Deduct inventory stock (atomic)
2. **Create Order**: Insert order + Insert order_lines (atomic)
3. **Restock Inventory**: Update ingredient stock + Log transaction (atomic)

**Implementation**:
```javascript
const client = await pool.connect();
try {
  await client.query('BEGIN');
  // Multiple queries here
  await client.query('COMMIT');
} catch (e) {
  await client.query('ROLLBACK');
  throw e;
} finally {
  client.release();
}
```

## Performance Optimizations

### Database Indexing

**Indexes to Create**:
- `orders.status` - Frecuentes queries filtrando por estado
- `orders.assigned_cook_id` - Cook lookup de pedidos asignados
- `orders.created_at` - Reportes ordenados por fecha
- `ingredients.current_stock` - Queries de low-stock alerts
- `users.username` - Login lookups

### Caching Strategy

**Not implementing caching initially** debido a:
- Datos cambian frecuentemente (pedidos, inventario)
- Bajo volumen de requests (3-10 usuarios)
- Complejidad no justificada para scope actual
- Puede agregarse después si se detectan bottlenecks

### Frontend Performance

**Optimizations**:
- React.memo para componentes que re-renderizan frecuentemente
- Lazy loading de páginas con React.lazy
- Debounce en inputs de búsqueda
- Virtualization (react-window) si listas de pedidos crecen >100 items

## Deployment Strategy

### Development Environment

**Setup**:
- Backend: `npm run dev` con nodemon (auto-reload)
- Frontend: `npm start` con Vite/CRA dev server
- Database: PostgreSQL en 192.168.100.35:5433
- Environment variables en `.env` files

### Production Deployment (LAN)

**Backend Deployment**:
- Run backend en servidor central (probablemente el mismo host de DB: 192.168.100.35)
- PM2 para process management y auto-restart
- Nginx como reverse proxy (opcional)
- Logs rotados diariamente

**Frontend Deployment**:
- Build estático: `npm run build`
- Servir con Express static o nginx
- Accesible desde cualquier dispositivo en LAN

**Database Backups**:
- Backup diario automatizado via cron + pg_dump
- Retention: últimos 7 días
- Stored en disk separado

## Testing Strategy

### Backend Testing

**Unit Tests** (Jest):
- Services: orderService, kitchenService, inventoryService
- Utils: validators, formatters
- Coverage target: >70%

**Integration Tests** (Jest + Supertest):
- API endpoints con database test
- Use test database separada
- Seed data antes de cada test suite
- Coverage: todos los endpoints principales

**E2E Tests** (opcional, Fase 2):
- Playwright para flujos completos
- Prioridad baja inicialmente

### Frontend Testing

**Component Tests** (Jest + RTL):
- Common components: Button, Input, Card
- Critical components: OrderForm, OrderCard
- Coverage target: >60%

**Integration Tests**:
- Page-level tests con mocked API
- Navigation flows

## Open Questions Resolved

✅ **Real-time updates**: Socket.io con room-based broadcasting  
✅ **Authentication**: JWT with bcrypt password hashing  
✅ **Inventory management**: Real-time stock tracking with transactions  
✅ **Database choice**: PostgreSQL for ACID compliance  
✅ **State management**: React Context + hooks, no Redux needed  
✅ **Deployment target**: Local network (LAN) server  

## Next Phase: Design

Con las decisiones técnicas establecidas, Phase 1 generará:
- **data-model.md**: Schema detallado de PostgreSQL con relaciones
- **contracts/**: OpenAPI spec para todos los endpoints REST
- **quickstart.md**: Guía paso a paso para setup y desarrollo

