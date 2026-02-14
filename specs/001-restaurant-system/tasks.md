# Tasks: Sistema de Gestión de Restaurante

**Feature**: 001-restaurant-system  
**Branch**: `001-restaurant-system`  
**Date**: 2026-02-09 (Updated - Analysis corrections applied)

**Input**: Design documents from `/specs/001-restaurant-system/`
- ✅ plan.md (technical architecture)
- ✅ spec.md (4 user stories + 38 functional requirements)
- ✅ research.md (technical decisions)
- ✅ data-model.md (database schema with 8 tables)
- ✅ contracts/openapi.yaml (REST API spec with 27+ endpoints)
- ✅ quickstart.md (developer guide)

**Tests**: Not explicitly requested in specification - tests are OPTIONAL and can be added incrementally

**Organization**: Tasks grouped by user story for independent implementation and testing

**Updates**: 
- Added **FR-030 to FR-038**: Ingredient management UI, recipe instructions, customer history
- New table: `customers` with order history tracking
- New field: `recipes.instructions` for preparation steps
- New endpoints: Ingredient CRUD, recipes with instructions, customer management

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3, US4) - omitted for Setup/Foundational/Polish phases
- **File paths**: Exact paths from plan.md structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and directory structure

- [ ] T001 Create root project structure with backend/ and frontend/ directories
- [ ] T002 Initialize backend Node.js project with package.json in backend/
- [ ] T003 Initialize frontend React project with package.json in frontend/
- [ ] T004 [P] Create backend/.env.example with all required environment variables
- [ ] T005 [P] Create frontend/.env.example with API_URL and WS_URL
- [ ] T006 [P] Configure ESLint and Prettier for backend in backend/.eslintrc.json
- [ ] T007 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.json
- [ ] T008 [P] Create .gitignore files for backend and frontend
- [ ] T009 [P] Install backend dependencies: express, pg, socket.io, bcrypt, jsonwebtoken, winston, cors, helmet
- [ ] T010 [P] Install frontend dependencies: react, react-router-dom, axios, socket.io-client, material-ui or tailwindcss
- [ ] T011 [P] Install dev dependencies: jest, supertest, nodemon, @testing-library/react

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story implementation

**⚠️ CRITICAL**: Backend database and authentication MUST be complete before ANY backend user story work. Frontend foundation (T046-T057) can proceed in parallel with backend development

### Database Foundation

- [ ] T012 Create database connection pool in backend/src/database/connection.js
- [ ] T013 Setup migration framework using node-pg-migrate in backend/src/database/migrations/
- [ ] T014 Create migration 001_create_users_table in backend/src/database/migrations/001_create_users.sql
- [ ] T015 Create migration 002_create_menu_items_table in backend/src/database/migrations/002_create_menu_items.sql
- [ ] T016 Create migration 003_create_ingredients_table in backend/src/database/migrations/003_create_ingredients.sql
- [ ] T017 Create migration 004_create_customers_table in backend/src/database/migrations/004_create_customers.sql
- [ ] T018 Create migration 005_create_recipes_table in backend/src/database/migrations/005_create_recipes.sql (include instructions TEXT field)
- [ ] T019 Create migration 006_create_orders_table in backend/src/database/migrations/006_create_orders.sql (include customer_id FK)
- [ ] T020 Create migration 007_create_order_lines_table in backend/src/database/migrations/007_create_order_lines.sql
- [ ] T021 Create migration 008_create_stock_transactions_table in backend/src/database/migrations/008_create_stock_transactions.sql
- [ ] T022 Create migration 009_create_indexes in backend/src/database/migrations/009_create_indexes.sql
- [ ] T023 Create migration 010_create_triggers in backend/src/database/migrations/010_create_triggers.sql (update_order_total, deduct_inventory)
- [ ] T024 Run all migrations against database to create schema
- [ ] T025 Create seed script in backend/src/database/seeds/001_seed_users.js (create default users with hashed passwords)
- [ ] T026 [P] Create seed script in backend/src/database/seeds/002_seed_menu_items.js
- [ ] T027 [P] Create seed script in backend/src/database/seeds/003_seed_ingredients.js
- [ ] T028 [P] Create seed script in backend/src/database/seeds/004_seed_customers.js
- [ ] T029 [P] Create seed script in backend/src/database/seeds/005_seed_recipes.js (with sample instructions)
- [ ] T030 Run all seed scripts to populate initial data

### Authentication & Authorization Foundation

- [ ] T031 Create User model in backend/src/models/User.js
- [ ] T032 [P] Create Customer model in backend/src/models/Customer.js
- [ ] T033 Implement authService with bcrypt password hashing (10 rounds) and password validation (min 8 chars) in backend/src/services/authService.js
- [ ] T034 Implement JWT token generation and validation in backend/src/services/authService.js
- [ ] T035 Create auth middleware for JWT validation in backend/src/middleware/auth.js
- [ ] T036 Create role-based access control middleware in backend/src/middleware/roleCheck.js
- [ ] T037 Create authentication routes (POST /api/auth/login, GET /api/auth/me) in backend/src/routes/auth.js

### API Infrastructure
8 Create Express app setup in backend/src/server.js with CORS, helmet, body-parser
- [ ] T039 Setup error handling middleware in backend/src/middleware/errorHandler.js
- [ ] T040 Setup Winston logger utility in backend/src/utils/logger.js
- [ ] T041 Create input validation utilities in backend/src/utils/validators.js
- [ ] T042 Setup API router structure in backend/src/routes/index.js mounting all route modules

### WebSocket Foundation

- [ ] T043 Setup Socket.io server in backend/src/websocket/socketHandler.js
- [ ] T044 Implement room-based broadcasting (kitchen, managers, order-takers) in socketHandler.js
- [ ] T045 Implement socket authentication using JWT in socketHandler.js

### Frontend Foundation

- [ ] T046 Create React app structure with App.jsx and index.jsx in frontend/src/
- [ ] T047 Setup React Router with route definitions in frontend/src/App.jsx
- [ ] T048 Create axios API client instance in frontend/src/services/api.js with interceptors
- [ ] T049 [P] Create AuthContext for global auth state in frontend/src/context/AuthContext.jsx
- [ ] T050 [P] Create OrderContext for real-time order state in frontend/src/context/OrderContext.jsx
- [ ] T051 Create useAuth custom hook in frontend/src/hooks/useAuth.js
- [ ] T052 Create useSocket custom hook for WebSocket in frontend/src/hooks/useSocket.js
- [ ] T053 Setup Socket.io client in frontend/src/services/socket.js
- [ ] T054 [P] Create Login page component in frontend/src/pages/Login.jsx
- [ ] T055 [P] Create common UI components (Button, Input, Card, Modal) in frontend/src/components/common/
- [ ] T056 Create constants file with order statuses, roles in frontend/src/utils/constants.js
- [ ] T057 [P] Create date/currency formatters in frontend/src/utils/formatters.js

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Gestión de Cola de Pedidos (Priority: P1) 🎯 MVP

**Goal**: Tomadores de pedidos pueden crear pedidos con items del menú, ver cola de pedidos, obtener montos para cobro, y gestionar asignación/estado de pedidos en representación de cocineros

**Independent Test**: Crear pedido con varios items → verificar aparece en cola con estado "Pendiente" → verificar cálculo correcto del total → buscar pedido por ID/mesa → asignar manualmente a cocinero → actualizar estado a "En Proceso"/"Completado" → ver detalle completo

### Backend for User Story 1

- [ ] T058 [P] [US1] Create MenuItem model in backend/src/models/MenuItem.js
- [ ] T059 [P] [US1] Create Order model in backend/src/models/Order.js
- [ ] T060 [P] [US1] Create OrderLine model in backend/src/models/OrderLine.js
- [ ] T061 [US1] Implement orderService.createOrder() in backend/src/services/orderService.js (support customer_id optional)
- [ ] T062 [US1] Implement orderService.getAllOrders() with status filtering in backend/src/services/orderService.js
- [ ] T063 [US1] Implement orderService.getOrderById() in backend/src/services/orderService.js
- [ ] T064 [P] [US1] Implement customerService.createCustomer() in backend/src/services/customerService.js
- [ ] T065 [P] [US1] Implement customerService.findByPhone() in backend/src/services/customerService.js
- [ ] T066 [US1] Create menu routes (GET /api/menu) in backend/src/routes/menu.js
- [ ] T067 [US1] Create order routes (POST /api/orders, GET /api/orders, GET /api/orders/:id) in backend/src/routes/orders.js
- [ ] T068 [US1] Create customer routes (POST /api/customers) in backend/src/routes/customers.js
- [ ] T069 [US1] Add validation for create order request (minimum 1 item, valid menu_item_ids) in routes/orders.js
- [ ] T060A [US1] Add pre-order ingredient availability check in orderService.createOrder() - validate sufficient stock before allowing order creation with detailed error message listing missing ingredients (FR-024)
- [ ] T070 [US1] Add WebSocket event emission for 'order:created' in orderService.js
- [ ] T071 [US1] Add role check middleware to order routes (order_taker, manager) in routes/orders.js
- [ ] T071A [US1] Implement orderService.assignOrderToCook(orderId, cookId, userId) for manual assignment by order_taker (FR-006A)
- [ ] T071B [US1] Add PUT /api/orders/:id/assign endpoint allowing order_taker to assign orders to specific cooks (FR-006A)
- [ ] T071C [US1] Update PUT /api/orders/:id/status to allow order_taker role in addition to cook role (FR-006B)

### Frontend for User Story 1

- [ ] T072 [P] [US1] Create orderService API client in frontend/src/services/orderService.js (createOrder, getOrders, getOrderById)
- [ ] T073 [P] [US1] Create menuService API client in frontend/src/services/menuService.js (getMenu)
- [ ] T074 [P] [US1] Create customerService API client in frontend/src/services/customerService.js (createCustomer, findByPhone)
- [ ] T075 [P] [US1] Create OrderCard component in frontend/src/components/orders/OrderCard.jsx
- [ ] T076 [P] [US1] Create OrderList component in frontend/src/components/orders/OrderList.jsx
- [ ] T077 [P] [US1] Create MenuItemCard component in frontend/src/components/menu/MenuItemCard.jsx
- [ ] T078 [P] [US1] Create CustomerSelector component in frontend/src/components/orders/CustomerSelector.jsx (optional field with quick search)
- [ ] T079 [US1] Create OrderTakerDashboard page in frontend/src/pages/OrderTaker/OrderTakerDashboard.jsx (shows order queue)
- [ ] T080 [US1] Create CreateOrder page in frontend/src/pages/OrderTaker/CreateOrder.jsx (menu selection, customer optional, order creation form)
- [ ] T081 [US1] Implement real-time order updates using WebSocket 'order:created' event in OrderContext.jsx
- [ ] T082 [US1] Add navigation between OrderTakerDashboard and CreateOrder in App.jsx routes
- [ ] T083 [US1] Implement order search/filter by table number or ID in OrderTakerDashboard
- [ ] T083A [US1] Create CookSelector dropdown component in frontend/src/components/orders/CookSelector.jsx (list of all cooks for manual assignment)
- [ ] T083B [US1] Add manual assignment functionality to OrderTakerDashboard - assign pending orders to specific cooks (FR-006A)
- [ ] T083C [US1] Add status update buttons to OrderCard in OrderTakerDashboard - mark orders as in_progress/completed (FR-006B)
- [ ] T083D [US1] Display assigned cook name on OrderCard for order_taker visibility

**Checkpoint**: User Story 1 complete - Order takers can create orders with optional customer info, view queue, search orders

---

## Phase 4: User Story 2 - Gestión de Cocina y Asignación (Priority: P1) 

**Goal**: Cocineros ven pedido asignado con instrucciones de preparación, pueden marcarlo como completado, reciben siguiente pedido automáticamente

**Independent Test**: Cocinero inicia sesión → ve pedido asignado con detalle e instrucciones → marca en proceso → marca completado → recibe siguiente pedido → ve contador de pedidos completados

### Backend for User Story 2

- [ ] T084 [P] [US2] Create Recipe model in backend/src/models/Recipe.js (includes instructions field)
- [ ] T085 [US2] Implement kitchenService.assignOrderToCook() in backend/src/services/kitchenService.js (auto-assign oldest pending order)
- [ ] T086 [US2] Implement kitchenService.getAssignedOrder(cookId) in backend/src/services/kitchenService.js
- [ ] T087 [US2] Implement kitchenService.updateOrderStatus() in backend/src/services/kitchenService.js (assigned → in_progress → completed)
- [ ] T088 [US2] Implement kitchenService.getCookStats(cookId) in backend/src/services/kitchenService.js (completed count, avg time)
- [ ] T089 [US2] Implement recipeService.getRecipeWithInstructions(menuItemId) in backend/src/services/recipeService.js
- [ ] T090 [US2] Create kitchen routes (GET /api/kitchen/assigned, POST /api/kitchen/request-order, GET /api/kitchen/stats) in backend/src/routes/kitchen.js
- [ ] T091 [US2] Create recipe routes (GET /api/recipes/:menuItemId) in backend/src/routes/recipes.js
- [ ] T092 [US2] Create order status update route (PUT /api/orders/:id/status) in backend/src/routes/orders.js
- [ ] T093 [US2] Add role check middleware to kitchen routes (cook role only) in routes/kitchen.js
- [ ] T094 [US2] Add WebSocket event emission for 'order:assigned', 'order:completed' in kitchenService.js
- [ ] T095 [US2] Implement auto-assignment logic: when order marked completed, trigger next assignment in kitchenService.js
- [ ] T096 [US2] Add order state machine validation (prevent invalid transitions) in kitchenService.js

### Frontend for User Story 2

- [ ] T097 [P] [US2] Create kitchenService API client in frontend/src/services/kitchenService.js (getAssigned, requestOrder, updateStatus, getStats)
- [ ] T098 [P] [US2] Create recipeService API client in frontend/src/services/recipeService.js (getRecipeWithInstructions)
- [ ] T099 [P] [US2] Create AssignedOrder component showing order details in frontend/src/components/orders/AssignedOrder.jsx
- [ ] T100 [P] [US2] Create RecipeInstructions component in frontend/src/components/kitchen/RecipeInstructions.jsx (displays preparation steps)
- [ ] T101 [P] [US2] Create StatsCard component for cook statistics in frontend/src/components/dashboard/StatsCard.jsx
- [ ] T102 [US2] Create CookDashboard page in frontend/src/pages/Cook/CookDashboard.jsx (shows assigned order, instructions, stats)
- [ ] T103 [US2] Implement order status buttons (Start, Complete) in AssignedOrder component
- [ ] T104 [US2] Implement recipe instructions display with ingredients list in CookDashboard
- [ ] T105 [US2] Implement real-time updates for order:assigned and order:completed WebSocket events in OrderContext.jsx
- [ ] T106 [US2] Add auto-refresh when new order assigned via WebSocket in CookDashboard
- [ ] T107 [US2] Add completed orders counter display in CookDashboard
- [ ] T108 [US2] Add navigation for Cook role to CookDashboard in App.jsx routes

**Checkpoint**: User Story 2 complete - Cooks see assignments with instructions, update status, auto-receive next order

---

## Phase 5: User Story 3 - Dashboard de Supervisión Gerencial (Priority: P2)

**Goal**: Gerentes ven estadísticas en tiempo real: pedidos por estado, asignaciones de cocineros, tiempos, recaudación, e historial de clientes

**Independent Test**: Procesar varios pedidos → acceder dashboard → verificar conteos correctos por estado → ver asignaciones actuales → verificar cálculo de recaudación → ver tiempos promedio → consultar historial de clientes

### Backend for User Story 3

- [ ] T109 [US3] Implement reportService.getDailyStats(date) in backend/src/services/reportService.js (orders by status, revenue, avg time)
- [ ] T110 [US3] Implement reportService.getCookAssignments() in backend/src/services/reportService.js (current orders per cook)
- [ ] T111 [US3] Implement reportService.getRevenueReport(fromDate, toDate) in backend/src/services/reportService.js
- [ ] T112 [US3] Implement reportService.getOrdersByStatus() in backend/src/services/reportService.js (real-time counts)
- [ ] T113 [US3] Implement customerService.getAllCustomers() in backend/src/services/customerService.js
- [ ] T114 [US3] Implement customerService.getCustomerHistory(customerId) in backend/src/services/customerService.js (orders + total spent)
- [ ] T115 [US3] Create report routes (GET /api/reports/daily, GET /api/reports/revenue) in backend/src/routes/reports.js
- [ ] T116 [US3] Create customer routes (GET /api/customers, GET /api/customers/:id) in backend/src/routes/customers.js
- [ ] T117 [US3] Add role check middleware to report routes (manager role only) in routes/reports.js
- [ ] T118 [US3] Add WebSocket event emission for 'stats:update' on order status changes in orderService.js
- [ ] T119 [US3] Implement query optimization for dashboard aggregations (use indexes) in reportService.js

### Frontend for User Story 3

- [ ] T120 [P] [US3] Create reportService API client in frontend/src/services/reportService.js (getDailyStats, getRevenue, getAssignments)
- [ ] T121 [P] [US3] Create customerService API client extension in frontend/src/services/customerService.js (getCustomers, getCustomerHistory)
- [ ] T122 [P] [US3] Create OrderStatusChart component in frontend/src/components/dashboard/OrderStatusChart.jsx (pending, in_progress, completed counts)
- [ ] T123 [P] [US3] Create RevenueCard component in frontend/src/components/dashboard/RevenueCard.jsx
- [ ] T124 [P] [US3] Create CookAssignments component in frontend/src/components/dashboard/CookAssignments.jsx (list of cook → order mappings)
- [ ] T125 [P] [US3] Create TimeMetrics component in frontend/src/components/dashboard/TimeMetrics.jsx (avg prep time, delays)
- [ ] T126 [P] [US3] Create CustomerList component in frontend/src/components/customers/CustomerList.jsx
- [ ] T127 [P] [US3] Create CustomerHistory component in frontend/src/components/customers/CustomerHistory.jsx (order history, total spent)
- [ ] T128 [US3] Create ManagerDashboard page in frontend/src/pages/Manager/ManagerDashboard.jsx (main overview)
- [ ] T129 [US3] Create ReportsView page in frontend/src/pages/Manager/ReportsView.jsx (detailed reports, date filtering)
- [ ] T130 [US3] Create CustomersView page in frontend/src/pages/Manager/CustomersView.jsx (customer list and history)
- [ ] T131 [US3] Implement real-time dashboard updates using WebSocket 'stats:update' event in ManagerDashboard
- [ ] T132 [US3] Add date range picker for revenue reports in ReportsView
- [ ] T133 [US3] Add auto-refresh every 3 seconds for real-time metrics in ManagerDashboard
- [ ] T134 [US3] Add customer search and filtering in CustomersView
- [ ] T135 [US3] Add navigation for Manager role to ManagerDashboard in App.jsx routes

**Checkpoint**: User Story 3 complete - Managers have real-time visibility into operations and customer history

---

## Phase 6: User Story 4 - Control de Inventario y Materia Prima (Priority: P3)

**Goal**: Gerentes ven materia prima consumida basada en pedidos, generan lista de compras, gestionan stock en tiempo real

**Independent Test**: Configurar ingredientes para items → procesar pedidos → verificar cálculo de consumo → ver alertas de stock bajo → registrar entrada de mercadería → generar reporte de compras

### Backend for User Story 4

- [ ] T136 [P] [US4] Create Ingredient model in backend/src/models/Ingredient.js
- [ ] T137 [P] [US4] Create StockTransaction model in backend/src/models/StockTransaction.js
- [ ] T138 [US4] Implement inventoryService.getIngredients() in backend/src/services/inventoryService.js
- [ ] T139 [US4] Implement inventoryService.getLowStockIngredients() in backend/src/services/inventoryService.js (current_stock < min_stock)
- [ ] T140 [US4] Implement inventoryService.restockIngredient(ingredientId, quantity) in backend/src/services/inventoryService.js
- [ ] T141 [US4] Implement inventoryService.calculateConsumption(orderId) in backend/src/services/inventoryService.js (via recipes)
- [ ] T142 [US4] Implement inventoryService.generatePurchaseList() in backend/src/services/inventoryService.js (ingredients below min)
- [ ] T143 [US4] Create inventory routes (GET /api/inventory, POST /api/inventory/:id/restock) in backend/src/routes/inventory.js
- [ ] T144 [US4] Add role check middleware to inventory routes (manager role only) in routes/inventory.js
- [ ] T145 [US4] Integrate inventory deduction with order completion trigger (already in migration 010) - verify it works
- [ ] T146 [US4] Add WebSocket event emission for 'inventory:low-stock' when ingredient drops below min in inventoryService.js
- [ ] T147 [US4] Add transaction validation: prevent stock from going negative in inventoryService.js

### Frontend for User Story 4

- [ ] T148 [P] [US4] Create inventoryService API client in frontend/src/services/inventoryService.js (getIngredients, restock, getLowStock, getPurchaseList)
- [ ] T149 [P] [US4] Create IngredientCard component in frontend/src/components/inventory/IngredientCard.jsx (shows name, stock, unit)
- [ ] T150 [P] [US4] Create IngredientList component in frontend/src/components/inventory/IngredientList.jsx
- [ ] T151 [P] [US4] Create RestockModal component in frontend/src/components/inventory/RestockModal.jsx (form to add stock)
- [ ] T152 [P] [US4] Create LowStockAlert component in frontend/src/components/inventory/LowStockAlert.jsx
- [ ] T153 [US4] Create InventoryView page in frontend/src/pages/Manager/InventoryView.jsx (main inventory management)
- [ ] T154 [US4] Implement low stock filtering and highlighting in InventoryView
- [ ] T155 [US4] Implement restock functionality with modal form (quantity input, notes field, transaction recording) in InventoryView
- [ ] T156 [US4] Implement purchase list generation and export in InventoryView
- [ ] T157 [US4] Add real-time inventory updates using WebSocket 'inventory:low-stock' event in InventoryView
- [ ] T158 [US4] Add navigation to InventoryView from ManagerDashboard in App.jsx routes

**Checkpoint**: User Story 4 complete - Inventory tracking and purchase planning functional

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements affecting multiple user stories, documentation, optimization

### Menu Management (Manager Functionality)

- [ ] T159 [P] Implement menuService.createMenuItem() in backend/src/services/menuService.js
- [ ] T160 [P] Implement menuService.updateMenuItem(id) in backend/src/services/menuService.js
- [ ] T161 [P] Create menu management routes (POST /api/menu, PUT /api/menu/:id) in backend/src/routes/menu.js
- [ ] T162 [P] Add role check (manager only) to menu creation/update routes
- [ ] T163 [P] Create MenuManagement page in frontend/src/pages/Manager/MenuManagement.jsx (add/edit menu items)

### Ingredient Management UI (Manager Functionality) 🆕

**Purpose**: FR-030 to FR-032 - Complete CRUD de ingredientes desde la interfaz

- [ ] T164 [P] Implement inventoryService.createIngredient() in backend/src/services/inventoryService.js
- [ ] T165 [P] Implement inventoryService.updateIngredient(id) in backend/src/services/inventoryService.js
- [ ] T166 [P] Implement inventoryService.deleteIngredient(id) in backend/src/services/inventoryService.js (validate not used in recipes)
- [ ] T167 [P] Create ingredient CRUD routes (POST /api/inventory, PUT /api/inventory/:id, DELETE /api/inventory/:id) in backend/src/routes/inventory.js
- [ ] T168 [P] Create CreateIngredientModal component in frontend/src/components/inventory/CreateIngredientModal.jsx (form de creación)
- [ ] T169 [P] Create EditIngredientModal component in frontend/src/components/inventory/EditIngredientModal.jsx (form de edición)
- [ ] T170 [P] Add create/edit/delete buttons to InventoryView page in frontend/src/pages/Manager/InventoryView.jsx
- [ ] T171 [P] Add validation: prevent delete if ingredient used in recipes in frontend

### Recipe Instructions Management (Manager Functionality) 🆕

**Purpose**: FR-033 to FR-035 - Editar instrucciones de preparación desde la interfaz

- [ ] T172 [P] Implement recipeService.updateInstructions(menuItemId, instructions) in backend/src/services/recipeService.js
- [ ] T173 [P] Create recipe update route (PUT /api/recipes/:menuItemId/instructions) in backend/src/routes/recipes.js
- [ ] T174 [P] Create RecipeEditor component in frontend/src/components/menu/RecipeEditor.jsx (textarea para instrucciones)
- [ ] T175 [P] Add recipe instructions editing to MenuManagement page

### User Management (Manager Functionality)

- [ ] T176 [P] Implement userService.createUser() in backend/src/services/userService.js (with password hashing)
- [ ] T177 [P] Implement userService.getAllUsers() in backend/src/services/userService.js
- [ ] T178 [P] Create user routes (GET /api/users, POST /api/users) in backend/src/routes/users.js
- [ ] T179 [P] Add role check (manager only) to user management routes
- [ ] T180 [P] Create UserManagement page in frontend/src/pages/Manager/UserManagement.jsx (list users, create new)

### UI/UX Enhancements

- [ ] T181 [P] Add loading states to all pages and components across frontend
- [ ] T182 [P] Add error toast notifications for failed operations in frontend
- [ ] T183 [P] Implement responsive design for tablet/mobile viewports in frontend
- [ ] T184 [P] Add confirmation dialogs for destructive actions (complete order, etc.) in frontend
- [ ] T185 [P] Add keyboard shortcuts for common actions (create order: Ctrl+N, etc.) in frontend
- [ ] T186 [P] Improve order card visual design with status colors in OrderCard component

### Performance & Optimization

- [ ] T187 [P] Add React.memo to frequently re-rendering components (OrderCard, MenuItemCard)
- [ ] T188 [P] Implement pagination for order lists if > 50 orders in OrderList component
- [ ] T189 [P] Add database query result caching for menu items (rarely change) in backend
- [ ] T190 [P] Optimize WebSocket event frequency (debounce stats updates) in backend socketHandler
- [ ] T191 [P] Add database connection pooling configuration in backend connection.js

### Documentation & Testing

- [ ] T192 [P] Write API documentation using Swagger/OpenAPI in docs/api/
- [ ] T193 [P] Create database setup guide in docs/setup/database-setup.md
- [ ] T194 [P] Create deployment guide for LAN server in docs/setup/deployment.md
- [ ] T195 [P] Write user guide for Manager role in docs/user-guides/manager-guide.md
- [ ] T196 [P] Write user guide for Cook role in docs/user-guides/cook-guide.md
- [ ] T197 [P] Write user guide for Order Taker role in docs/user-guides/order-taker-guide.md
- [ ] T198 [P] Add unit tests for critical services (orderService, kitchenService) in backend/tests/unit/
- [ ] T199 [P] Add integration tests for API endpoints in backend/tests/integration/
- [ ] T200 [P] Add component tests for critical UI (OrderCard, CreateOrder) in frontend/tests/

### Security & Error Handling

- [ ] T201 [P] Add input sanitization to all user inputs in backend validators
- [ ] T202 [P] Add rate limiting to login endpoint (prevent brute force) in backend
- [ ] T203 [P] Audit and remove any console.log statements, replace with proper logging
- [ ] T204 [P] Add error boundaries to React app for graceful error handling in frontend
- [ ] T205 [P] Implement session timeout and auto-logout after inactivity in frontend
- [ ] T205A [P] Implement 30-minute inactivity timeout in AuthContext (FR-028)
- [ ] T206 [P] Add HTTPS configuration guide for production in docs/

### Audit Logging (FR-029) 🆕

**Purpose**: FR-029 - Registro de auditoría para acciones críticas

- [ ] T206A [P] Create migration 011_create_audit_log_table in backend/src/database/migrations/011_create_audit_log.sql (action, user_id, entity_type, entity_id, old_values, new_values, timestamp, ip_address)
- [ ] T206B [P] Create AuditLog model in backend/src/models/AuditLog.js
- [ ] T206C [P] Implement auditService.logAction(action, userId, entityType, entityId, oldValues, newValues, req) in backend/src/services/auditService.js
- [ ] T206D [P] Create audit middleware in backend/src/middleware/auditLog.js for automatic logging on routes
- [ ] T206E [P] Integrate auditService.logAction() in orderService for order creation/modification/deletion
- [ ] T206F [P] Integrate auditService.logAction() in authService for login attempts (success/failure)
- [ ] T206G [P] Integrate auditService.logAction() in userService for user creation/modification
- [ ] T206H [P] Integrate auditService.logAction() in menuService for menu/price changes
- [ ] T206I [P] Integrate auditService.logAction() in inventoryService for stock transactions
- [ ] T206J [P] Create GET /api/audit endpoint for managers to view audit log in backend/src/routes/audit.js
- [ ] T206K [P] Create AuditLogView page in frontend/src/pages/Manager/AuditLogView.jsx (filterable audit trail)

### Final Validation

- [ ] T207 Run full end-to-end test: Create order with customer → Assign to cook → View instructions → Complete → Check inventory → Verify reports
- [ ] T208 Validate quickstart.md instructions work on fresh setup
- [ ] T209 Run database backup and restore test
- [ ] T210 Performance test: Create 50+ orders and verify system responsiveness
- [ ] T211 Security audit: Verify all endpoints have proper auth and role checks
- [ ] T212 Code cleanup: Remove commented code, organize imports, fix linting warnings

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - **BLOCKS all user stories**
- **User Stories (Phases 3-6)**: All depend on Foundational phase completion
  - US1 & US2 (P1 priority) should be done first
  - US3 (P2) can start after US1/US2 or in parallel if staffed
  - US4 (P3) can start after Foundational or in parallel
- **Polish (Phase 7)**: Depends on desired user stories being complete

### User Story Independence

- **US1 (Gestión de Pedidos)**: Fully independent after Foundational
- **US2 (Gestión de Cocina)**: Independent after Foundational, integrates with US1 orders
- **US3 (Dashboard Gerencial)**: Independent after Foundational, reads from US1/US2 data
- **US4 (Control de Inventario)**: Independent after Foundational, integrates with US1/US2 via order completion

Each user story can be developed, tested, and deployed independently.

### Within Each User Story

Standard pattern for all stories:
1. Backend models first (can parallelize)
2. Backend services (depends on models)
3. Backend routes (depends on services)
4. Frontend API clients (can parallelize with above)
5. Frontend components (can parallelize)
6. Frontend pages (depends on components)
7. WebSocket integration
8. Integration testing

### Parallel Opportunities

**Setup Phase**: All T004-T011 marked [P] can run in parallel

**Foundational Phase**:
- Database migrations T012-T022 must be sequential
- Seeds T024-T027 marked [P] can run in parallel after migrations
- Auth tasks T029-T034 can run in parallel with API infrastructure T035-T039
- WebSocket T040-T042 can run in parallel with above
- Frontend foundation T043-T054 can run mostly in parallel

**User Story Phases**:
- Within each story, tasks marked [P] can run in parallel
- Different user stories can be worked on in parallel by different team members

**Polish Phase**: Most tasks marked [P] can run in parallel

---

## Parallel Example: User Story 1 Backend

```bash
# These models can be created simultaneously (different files):
T055: Create MenuItem model in backend/src/models/MenuItem.js
T056: Create Order model in backend/src/models/Order.js
T057: Create OrderLine model in backend/src/models/OrderLine.js

# These frontend components can be created simultaneously:
T068: Create OrderCard component
T069: Create OrderList component
T070: Create MenuItemCard component
```

---

## Implementation Strategy

### MVP First (US1 + US2 Only)

**Recommended for fastest time-to-value**:

1. ✅ Complete Phase 1: Setup (~2-3 hours)
2. ✅ Complete Phase 2: Foundational (~8-12 hours) **CRITICAL**
3. ✅ Complete Phase 3: User Story 1 (~8-10 hours)
4. ✅ Complete Phase 4: User Story 2 (~6-8 hours)
5. **STOP & VALIDATE**: Test order creation → kitchen assignment → completion flow
6. Deploy to LAN server for real-world testing
7. Gather feedback before building US3 and US4

**MVP Delivers**: Complete order management from creation to kitchen completion

### Incremental Delivery

For phased rollout:

1. Foundation (Phases 1-2) → **Core infrastructure ready** (~10-15 hours)
2. + User Story 1 → **Order taking functional** (~8-10 hours)
3. + User Story 2 → **Kitchen operations functional** (~6-8 hours) **← MVP HERE**
4. + User Story 3 → **Management oversight added** (~8-10 hours)
5. + User Story 4 → **Inventory control added** (~8-10 hours)
6. + Polish → **Production ready** (~6-8 hours)

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy

With 2-3 developers:

1. **Week 1**: All work together on Setup + Foundational (Phases 1-2)
2. **Week 2**: Once Foundational done:
   - Dev A: User Story 1 (orders)
   - Dev B: User Story 2 (kitchen)
   - Dev C: Start User Story 3 (dashboard)
3. **Week 3**: Integration + User Story 4 + Polish

---

## Estimated Effort

| Phase | Tasks | Est. Hours | Notes |
|-------|-------|------------|-------|
| Phase 1: Setup | T001-T011 | 2-3 | Can parallelize most |
| Phase 2: Foundational | T012-T057 | 28-34 | Critical path, +3 migrations for customers |
| Phase 3: US1 (P1) | T058-T083 | 10-12 | MVP feature 1, +customer integration |
| Phase 4: US2 (P1) | T084-T108 | 8-10 | MVP feature 2, +recipe instructions |
| Phase 5: US3 (P2) | T109-T135 | 10-12 | Management dashboard + customer history |
| Phase 6: US4 (P3) | T136-T158 | 8-10 | Inventory management |
| Phase 7: Polish | T159-T212 | 16-20 | Documentation, optimization, ingredient CRUD UI |
| **Total** | **212 tasks** | **82-101 hours** | **~2.5 weeks for 1 dev** |

**MVP (US1+US2)**: ~48-59 hours (~1.5 weeks for 1 developer)

---

## Task Progress Tracking

- **Total Tasks**: 232 (updated: +11 for audit logging FR-029)
- **Completed**: 0
- **In Progress**: 0
- **Remaining**: 232

### By Phase:
- Phase 1 (Setup): 0/11
- Phase 2 (Foundational): 0/46 (fixed duplicates)
- Phase 3 (US1): 0/34 (+7 for manual assignment FR-006A/FR-006B, +1 for stock validation T060A)
- Phase 4 (US2): 0/25
- Phase 5 (US3): 0/27
- Phase 6 (US4): 0/23
- Phase 7 (Polish): 0/66 (+1 for session timeout T205A, +11 for audit logging FR-029)

---

## Notes

- **[P] marker**: Tasks can run in parallel (different files, no file-level dependencies)
- **[Story] label**: Maps task to specific user story for traceability (US1, US2, US3, US4)
- **Critical Path**: Setup → Foundational → User Stories → Polish
- **MVP Scope**: Phases 1-4 (Setup + Foundational + US1 + US2)
- **Independent Testing**: Each user story should be fully testable on its own
- **Commit Strategy**: Commit after each task or small logical group
- **Validation Checkpoints**: Stop after each user story phase to validate independently

**Ready to begin implementation with `/speckit.implement` or start manual development!** 🚀
