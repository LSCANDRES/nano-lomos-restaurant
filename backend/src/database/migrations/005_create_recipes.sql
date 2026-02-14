-- Migration: 005_create_recipes_table
-- Creates recipes table to link menu items with ingredients and instructions

CREATE TABLE IF NOT EXISTS recipes (
  id SERIAL PRIMARY KEY,
  menu_item_id INTEGER NOT NULL REFERENCES menu_items(id) ON DELETE CASCADE,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE RESTRICT,
  quantity_required DECIMAL(10, 3) NOT NULL CHECK (quantity_required > 0),
  instructions TEXT CHECK (LENGTH(instructions) <= 2000),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (menu_item_id, ingredient_id)
);

-- Create indexes for recipe lookups
CREATE INDEX idx_recipes_menu_item_id ON recipes(menu_item_id);
CREATE INDEX idx_recipes_ingredient_id ON recipes(ingredient_id);

-- Create updated_at trigger
CREATE TRIGGER update_recipes_updated_at
BEFORE UPDATE ON recipes
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();
