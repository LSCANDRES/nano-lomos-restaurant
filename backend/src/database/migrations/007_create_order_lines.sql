-- Migration: 007_create_order_lines_table
-- Creates order_lines table for order items

CREATE TABLE IF NOT EXISTS order_lines (
  id SERIAL PRIMARY KEY,
  order_id INTEGER NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE RESTRICT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit_price DECIMAL(10, 2) NOT NULL CHECK (unit_price >= 0),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for order line queries
CREATE INDEX idx_order_lines_order_id ON order_lines(order_id);
CREATE INDEX idx_order_lines_menu_item_id ON order_lines(menu_item_id);

-- Create updated_at trigger
CREATE TRIGGER update_order_lines_updated_at
BEFORE UPDATE ON order_lines
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
