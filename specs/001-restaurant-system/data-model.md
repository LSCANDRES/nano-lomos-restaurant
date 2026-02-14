# Data Model: Sistema de Gestión de Restaurante

**Feature**: 001-restaurant-system  
**Date**: 2026-02-08  
**Database**: PostgreSQL 14+

## Entity Relationship Overview

```
Customers (1) ─── (M) Orders [optional]
Users (1) ─── (M) Orders [assigned_cook]
Orders (1) ─── (M) OrderLines
MenuItems (1) ─── (M) OrderLines
MenuItems (M) ─── (M) Ingredients [via Recipes with instructions]
Ingredients (1) ─── (M) StockTransactions
```

## Tables

### users

Tabla de empleados del restaurante con roles y credenciales.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| username | VARCHAR(50) | UNIQUE NOT NULL | Usuario para login |
| password_hash | VARCHAR(255) | NOT NULL | Hash bcrypt de contraseña |
| full_name | VARCHAR(100) | NOT NULL | Nombre completo del empleado |
| role | VARCHAR(20) | NOT NULL CHECK | Role: 'manager', 'cook', 'order_taker' |
| active | BOOLEAN | DEFAULT true | Si el usuario puede autenticarse |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última actualización |

**Indexes**:
- `idx_users_username` on `username` (login lookups)
- `idx_users_role` on `role` (queries por rol)

**Sample Data**:
```sql
INSERT INTO users (username, password_hash, full_name, role) VALUES
('gerente', '$2b$10$...', 'Juan Pérez', 'manager'),
('cocinero1', '$2b$10$...', 'María García', 'cook'),
('pedidos1', '$2b$10$...', 'Carlos López', 'order_taker');
```

### menu_items

Catálogo de platos y productos disponibles en el menú.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| name | VARCHAR(100) | NOT NULL | Nombre del plato |
| description | TEXT | NULL | Descripción opcional |
| price | DECIMAL(10,2) | NOT NULL CHECK >= 0 | Precio unitario |
| active | BOOLEAN | DEFAULT true | Si está disponible en el menú |
| category | VARCHAR(50) | NULL | Categoría: 'entradas', 'principales', 'bebidas', etc. |
| preparation_time_minutes | INT | DEFAULT 15 | Tiempo estimado de preparación |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última actualización |

**Indexes**:
- `idx_menu_items_active` on `active` (listar items disponibles)
- `idx_menu_items_category` on `category` (filtrar por categoría)

**Sample Data**:
```sql
INSERT INTO menu_items (name, description, price, category, preparation_time_minutes) VALUES
('Hamburguesa Clásica', 'Carne, lechuga, tomate, queso', 8.50, 'principales', 12),
('Ensalada César', 'Lechuga romana, pollo, crutones', 6.00, 'entradas', 8),
('Coca Cola', 'Bebida 500ml', 2.00, 'bebidas', 1);
```

### ingredients

Materia prima e ingredientes del inventario.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| name | VARCHAR(100) | NOT NULL | Nombre del ingrediente |
| unit | VARCHAR(20) | NOT NULL | Unidad: 'kg', 'litros', 'unidades' |
| current_stock | DECIMAL(10,3) | NOT NULL DEFAULT 0 | Stock actual disponible |
| min_stock | DECIMAL(10,3) | NOT NULL DEFAULT 0 | Punto de reorden (alerta) |
| cost_per_unit | DECIMAL(10,2) | NOT NULL DEFAULT 0 | Costo unitario para cálculos |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de creación |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última actualización |

**Indexes**:
- `idx_ingredients_low_stock` on `current_stock` WHERE `current_stock < min_stock` (alertas)

**Sample Data**:
```sql
INSERT INTO ingredients (name, unit, current_stock, min_stock, cost_per_unit) VALUES
('Carne molida', 'kg', 50.0, 10.0, 8.50),
('Lechuga', 'kg', 15.0, 3.0, 2.00),
('Tomate', 'kg', 20.0, 5.0, 1.50),
('Queso cheddar', 'kg', 10.0, 2.0, 12.00);
```

### recipes

Tabla de unión entre menu_items e ingredients (qué ingredientes necesita cada plato) con instrucciones de preparación.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| menu_item_id | INT | FOREIGN KEY → menu_items.id ON DELETE CASCADE | Plato |
| ingredient_id | INT | FOREIGN KEY → ingredients.id ON DELETE RESTRICT | Ingrediente |
| quantity_needed | DECIMAL(10,3) | NOT NULL CHECK > 0 | Cantidad por porción |
| instructions | TEXT | NULL | Instrucciones de preparación del plato (se repiten por fila pero solo se usa la del primer ingrediente) |

**Indexes**:
- `idx_recipes_menu_item` on `menu_item_id` (lookup ingredientes de un plato)
- `idx_recipes_ingredient` on `ingredient_id` (lookup platos que usan ingrediente)

**Unique Constraint**: `(menu_item_id, ingredient_id)` - No duplicar ingredientes

**Sample Data**:
```sql
-- Hamburguesa Clásica
INSERT INTO recipes (menu_item_id, ingredient_id, quantity_needed) VALUES
(1, 1, 0.200),  -- 200g carne molida
(1, 2, 0.050),  -- 50g lechuga
(1, 3, 0.100),  -- 100g tomate
(1, 4, 0.050);  -- 50g queso
```

### customers

Clientes del restaurante para tracking de historial de compras.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| first_name | VARCHAR(100) | NOT NULL | Nombre del cliente |
| last_name | VARCHAR(100) | NOT NULL | Apellido del cliente |
| phone | VARCHAR(20) | NULL | Teléfono de contacto |
| email | VARCHAR(100) | NULL | Email del cliente |
| created_at | TIMESTAMP | DEFAULT NOW() | Fecha de primer registro |
| updated_at | TIMESTAMP | DEFAULT NOW() | Última actualización |

**Indexes**:
- `idx_customers_name` on `(first_name, last_name)` (búsquedas por nombre)
- `idx_customers_phone` on `phone` (búsqueda por teléfono)

**Sample Data**:
```sql
INSERT INTO customers (first_name, last_name, phone, email) VALUES
('Juan', 'Pérez', '555-1234', 'juan.perez@email.com'),
('María', 'González', '555-5678', NULL),
('Carlos', 'Rodríguez', '555-9012', 'carlos.r@email.com');
```

### orders

Pedidos de clientes en el sistema.

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único (orden) |
| customer_id | INT | FOREIGN KEY → customers.id NULL | Cliente asociado (opcional) |
| table_number | VARCHAR(20) | NULL | Número de mesa o identificador |
| status | VARCHAR(20) | NOT NULL CHECK | Estado: 'pending','assigned','in_progress','completed' |
| assigned_cook_id | INT | FOREIGN KEY → users.id NULL | Cocinero asignado (si status >= assigned) |
| created_by_user_id | INT | FOREIGN KEY → users.id | Usuario que creó el pedido |
| total_amount | DECIMAL(10,2) | NOT NULL DEFAULT 0 | Monto total calculado |
| created_at | TIMESTAMP | DEFAULT NOW() | Hora de creación del pedido |
| assigned_at | TIMESTAMP | NULL | Hora de asignación a cocinero |
| started_at | TIMESTAMP | NULL | Hora en que cocinero comenzó preparación |
| completed_at | TIMESTAMP | NULL | Hora de completado |
| notes | TEXT | NULL | Notas adicionales del pedido |

**Indexes**:
- `idx_orders_status` on `status` (queries frecuentes por estado)
- `idx_orders_assigned_cook` on `assigned_cook_id` (pedidos de un cocinero)
- `idx_orders_created_at` on `created_at` (reportes ordenados por fecha)
- `idx_orders_customer` on `customer_id` (historial de pedidos por cliente)

**Check Constraints**:
- Status solo puede ser: 'pending', 'assigned', 'in_progress', 'completed'
- `assigned_cook_id` debe ser NULL si status = 'pending'
- `assigned_cook_id` debe ser NOT NULL si status IN ('assigned', 'in_progress', 'completed')

**Sample Data**:
```sql
INSERT INTO orders (table_number, status, created_by_user_id, total_amount, created_at) VALUES
('Mesa 5', 'pending', 3, 16.50, NOW() - INTERVAL '10 minutes'),
('Mesa 3', 'assigned', 3, 8.00, NOW() - INTERVAL '5 minutes');

UPDATE orders SET assigned_cook_id = 2, assigned_at = NOW() WHERE id = 2;
```

### order_lines

Líneas de pedido (items específicos dentro de un orden).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| order_id | INT | FOREIGN KEY → orders.id ON DELETE CASCADE | Orden padre |
| menu_item_id | INT | FOREIGN KEY → menu_items.id | Item del menú soliciitado |
| quantity | INT | NOT NULL CHECK > 0 | Cantidad de items |
| unit_price | DECIMAL(10,2) | NOT NULL | Precio unitario al momento del pedido |
| notes | TEXT | NULL | Modificaciones: 'sin cebolla', 'extra queso' |

**Indexes**:
- `idx_order_lines_order` on `order_id` (lookup lines de un pedido)

**Triggers**:
- After INSERT/UPDATE/DELETE: Recalcular `orders.total_amount`

**Sample Data**:
```sql
-- Orden 1: Mesa 5
INSERT INTO order_lines (order_id, menu_item_id, quantity, unit_price, notes) VALUES
(1, 1, 2, 8.50, NULL),  -- 2x Hamburguesa
(1, 3, 2, 2.00, NULL);  -- 2x Coca Cola

-- Orden 2: Mesa 3
INSERT INTO order_lines (order_id, menu_item_id, quantity, unit_price, notes) VALUES
(2, 2, 1, 6.00, 'Sin pollo'),  -- 1x Ensalada César
(2, 3, 1, 2.00, NULL);  -- 1x Coca Cola
```

### stock_transactions

Registro de movimientos de inventario (entradas y salidas de stock).

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | SERIAL | PRIMARY KEY | Identificador único |
| ingredient_id | INT | FOREIGN KEY → ingredients.id | Ingrediente afectado |
| transaction_type | VARCHAR(20) | NOT NULL CHECK | Tipo: 'restock', 'usage', 'adjustment' |
| quantity | DECIMAL(10,3) | NOT NULL | Cantidad (positiva para entrada, negativa para salida) |
| order_id | INT | FOREIGN KEY → orders.id NULL | Orden asociada (si type='usage') |
| performed_by_user_id | INT | FOREIGN KEY → users.id | Usuario que realizó la transacción |
| notes | TEXT | NULL | Notas adicionales |
| created_at | TIMESTAMP | DEFAULT NOW() | Timestamp de la transacción |

**Indexes**:
- `idx_stock_transactions_ingredient` on `ingredient_id` (historial por ingrediente)
- `idx_stock_transactions_created_at` on `created_at` (reportes por fecha)

**Check Constraints**:
- `transaction_type` IN ('restock', 'usage', 'adjustment')
- Si `transaction_type = 'usage'`, entonces `order_id` NOT NULL y `quantity < 0`
- Si `transaction_type = 'restock'`, entonces `quantity > 0`

**Sample Data**:
```sql
-- Compra de mercadería
INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity, performed_by_user_id, notes) VALUES
(1, 'restock', 20.0, 1, 'Compra semanal'),
(2, 'restock', 10.0, 1, 'Compra semanal');

-- Uso por pedido completado
INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity, order_id, performed_by_user_id, notes) VALUES
(1, 'usage', -0.400, 1, 2, 'Pedido #1 completado - 2 hamburguesas');
```

## Relationships Summary

### One-to-Many

1. **users → orders (assigned_cook)**
   - Un cocinero puede tener múltiples pedidos asignados
   - `orders.assigned_cook_id → users.id`

2. **users → orders (created_by)**
   - Un tomador de pedidos crea múltiples pedidos
   - `orders.created_by_user_id → users.id`

3. **orders → order_lines**
   - Un pedido contiene múltiples líneas (items)
   - `order_lines.order_id → orders.id`
   - CASCADE DELETE: si se elimina orden, se eliminan sus líneas

4. **menu_items → order_lines**
   - Un item del menú puede estar en múltiples pedidos
   - `order_lines.menu_item_id → menu_items.id`

5. **ingredients → stock_transactions**
   - Un ingrediente tiene múltiples transacciones de stock
   - `stock_transactions.ingredient_id → ingredients.id`

6. **customers → orders**
   - Un cliente puede tener múltiples pedidos
   - `orders.customer_id → customers.id`
   - NULL permitido: pedidos sin cliente registrado

### Many-to-Many

1. **menu_items ↔ ingredients (via recipes)**
   - Un plato usa múltiples ingredientes
   - Un ingrediente se usa en múltiples platos
   - `recipes` es tabla de unión con `quantity_needed`

## Business Rules Enforced by Schema

### Inventory Management

**Rule**: Stock nunca puede ser negativo
- Trigger `before_stock_reduction` valida que `current_stock - quantity >= 0`
- Si falla, transaction se rollback con error

**Rule**: Transacción de inventario al completar pedido
- Cuando `orders.status = 'completed'`, trigger automáticamente:
  1. Lookup all ingredients via recipes y order_lines
  2. Calculate total quantity needed
  3. Insert stock_transactions with type='usage'
  4. Update ingredients.current_stock

### Order State Machine

**Valid State Transitions**:
```
pending → assigned → in_progress → completed
```

**Enforced by**:
- Application logic (orderService.js)
- Database CHECK constraints en status column

### Pricing Consistency

**Rule**: `order_lines.unit_price` preserva precio histórico
- Al crear order_line, copiar `menu_items.price` actual
- Si menú cambia precios después, pedidos existentes no se afectan

**Rule**: `orders.total_amount` siempre suma de order_lines
- Trigger `update_order_total` recalcula automáticamente

## Migrations

### Migration Order

1. **001_create_users** - Base table para autenticación
2. **002_create_menu_items** - Catálogo de platos
3. **003_create_ingredients** - Inventario base
4. **004_create_customers** - Tabla de clientes
5. **005_create_recipes** - Relación menu ↔ ingredients con instrucciones
6. **006_create_orders** - Tabla de pedidos
7. **007_create_order_lines** - Detalle de pedidos
8. **008_create_stock_transactions** - Historial de inventario
9. **009_create_indexes** - Performance indexes
10. **010_create_triggers** - Business logic triggers

### Key Triggers

**trigger_update_order_total**:
```sql
CREATE OR REPLACE FUNCTION update_order_total()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE orders 
  SET total_amount = (
    SELECT COALESCE(SUM(quantity * unit_price), 0)
    FROM order_lines
    WHERE order_id = COALESCE(NEW.order_id, OLD.order_id)
  )
  WHERE id = COALESCE(NEW.order_id, OLD.order_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_order_total_trigger
AFTER INSERT OR UPDATE OR DELETE ON order_lines
FOR EACH ROW EXECUTE FUNCTION update_order_total();
```

**trigger_deduct_inventory_on_complete**:
```sql
CREATE OR REPLACE FUNCTION deduct_inventory_on_complete()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status <> 'completed' THEN
    -- Deduct stock for each ingredient in the order
    INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity, order_id, performed_by_user_id, notes)
    SELECT 
      r.ingredient_id,
      'usage',
      -1 * (ol.quantity * r.quantity_needed),
      NEW.id,
      NEW.assigned_cook_id,
      'Auto: Order #' || NEW.id || ' completed'
    FROM order_lines ol
    JOIN recipes r ON ol.menu_item_id = r.menu_item_id
    WHERE ol.order_id = NEW.id;
    
    -- Update current_stock
    UPDATE ingredients i
    SET current_stock = current_stock + (
      SELECT COALESCE(SUM(quantity), 0)
      FROM stock_transactions st
      WHERE st.ingredient_id = i.id AND st.order_id = NEW.id
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER deduct_inventory_trigger
AFTER UPDATE ON orders
FOR EACH ROW EXECUTE FUNCTION deduct_inventory_on_complete();
```

## Seed Data Strategy

### Development Seeds

**Users**: 1 manager, 2 cooks, 2 order takers  
**Menu Items**: 15-20 items across categories  
**Ingredients**: 30-40 common ingredients  
**Recipes**: Complete ingredient lists for all menu items  
**Orders**: 5-10 sample orders in various states  

### Production Initial Setup

**Users**: Real employees (gerente debe crear vía CLI/script)  
**Menu Items**: Menú real del restaurante  
**Ingredients**: Inventario inicial con stock counts  
**Recipes**: Recetas completas validadas por cocina  
**Orders**: Empty (operación comenzará limpia)  

## Performance Considerations

### Expected Query Patterns

**High Frequency**:
1. Get pending orders (kitchen queue)
2. Get assigned order for cook
3. List menu items
4. Check ingredient stock

**Medium Frequency**:
1. Create new order
2. Update order status
3. Get daily revenue
4. Get cook statistics

**Low Frequency**:
1. Inventory restocking
2. Menu updates
3. User management

### Optimization Strategy

- Indexes en todos los foreign keys
- Denormalized `total_amount` en orders (calculado por trigger)
- Denormalized `current_stock` en ingredients (actualizado por trigger)
- Connection pooling en backend (pg Pool)

## Backup & Recovery

**Daily Backups**: pg_dump completo  
**Retention**: 7 días  
**Point-in-time Recovery**: Opcional (WAL archiving si se requiere)  
**Restore Testing**: Mensual  

