-- Migration: 010_create_triggers
-- Business logic triggers

-- Trigger to update order total when order lines change
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
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_order_total_insert
AFTER INSERT ON order_lines
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trigger_update_order_total_update
AFTER UPDATE ON order_lines
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

CREATE TRIGGER trigger_update_order_total_delete
AFTER DELETE ON order_lines
FOR EACH ROW
EXECUTE FUNCTION update_order_total();

-- Trigger to deduct inventory when order is completed
CREATE OR REPLACE FUNCTION deduct_inventory_on_completion()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    -- Deduct ingredients for each menu item in the order
    UPDATE ingredients i
    SET current_stock = current_stock - (
      SELECT COALESCE(SUM(ol.quantity * r.quantity_required), 0)
      FROM order_lines ol
      JOIN recipes r ON r.menu_item_id = ol.menu_item_id
      WHERE ol.order_id = NEW.id AND r.ingredient_id = i.id
    )
    WHERE i.id IN (
      SELECT DISTINCT r.ingredient_id
      FROM order_lines ol
      JOIN recipes r ON r.menu_item_id = ol.menu_item_id
      WHERE ol.order_id = NEW.id
    );
    
    -- Record stock transactions
    INSERT INTO stock_transactions (ingredient_id, transaction_type, quantity, reference_id, reference_type)
    SELECT 
      r.ingredient_id,
      'usage',
      -(ol.quantity * r.quantity_required),
      NEW.id,
      'order'
    FROM order_lines ol
    JOIN recipes r ON r.menu_item_id = ol.menu_item_id
    WHERE ol.order_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_deduct_inventory
AFTER UPDATE ON orders
FOR EACH ROW
WHEN (NEW.status = 'completed')
EXECUTE FUNCTION deduct_inventory_on_completion();
