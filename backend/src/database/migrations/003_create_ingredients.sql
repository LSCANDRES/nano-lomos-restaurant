-- Migration: 003_create_ingredients_table
-- Creates ingredients table for inventory management

CREATE TABLE IF NOT EXISTS ingredients (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  unit VARCHAR(20) NOT NULL CHECK (unit IN ('kg', 'g', 'l', 'ml', 'unidad', 'unidades')),
  current_stock DECIMAL(10, 2) DEFAULT 0 CHECK (current_stock >= 0),
  min_stock DECIMAL(10, 2) DEFAULT 0 CHECK (min_stock >= 0),
  unit_cost DECIMAL(10, 2) DEFAULT 0 CHECK (unit_cost >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for low stock checks
CREATE INDEX idx_ingredients_low_stock ON ingredients(current_stock, min_stock);

-- Create updated_at trigger
CREATE TRIGGER update_ingredients_updated_at
BEFORE UPDATE ON ingredients
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
