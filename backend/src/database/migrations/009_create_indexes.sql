-- Migration: 009_create_indexes
-- Additional performance indexes

-- Orders performance indexes
CREATE INDEX IF NOT EXISTS idx_orders_status_created_at ON orders(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_assigned_cook_status ON orders(assigned_cook_id, status);

-- Stats and reports indexes
CREATE INDEX IF NOT EXISTS idx_orders_completed_at ON orders(completed_at DESC) WHERE status = 'completed';
CREATE INDEX IF NOT EXISTS idx_orders_created_by ON orders(created_by);

-- Recipe lookups
CREATE INDEX IF NOT EXISTS idx_recipes_composite ON recipes(menu_item_id, ingredient_id, quantity_required);

-- Customer history
CREATE INDEX IF NOT EXISTS idx_orders_customer_date ON orders(customer_id, created_at DESC);
