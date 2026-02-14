-- Add image_url column to menu_items table
-- Migration: 011_add_image_to_menu_items.sql

ALTER TABLE menu_items
ADD COLUMN image_url VARCHAR(500);

COMMENT ON COLUMN menu_items.image_url IS 'URL de la imagen ilustrativa del plato';

-- Create index for faster queries
CREATE INDEX idx_menu_items_image ON menu_items(image_url) WHERE image_url IS NOT NULL;
