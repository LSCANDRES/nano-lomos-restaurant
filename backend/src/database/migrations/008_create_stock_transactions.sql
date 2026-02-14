-- Migration: 008_create_stock_transactions_table
-- Creates stock_transactions table for inventory audit trail

CREATE TABLE IF NOT EXISTS stock_transactions (
  id SERIAL PRIMARY KEY,
  ingredient_id INTEGER NOT NULL REFERENCES ingredients(id) ON DELETE CASCADE,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('purchase', 'usage', 'adjustment')),
  quantity DECIMAL(10, 2) NOT NULL,
  reference_id INTEGER,
  reference_type VARCHAR(50),
  notes TEXT,
  created_by INTEGER REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for transaction queries
CREATE INDEX idx_stock_transactions_ingredient_id ON stock_transactions(ingredient_id);
CREATE INDEX idx_stock_transactions_created_at ON stock_transactions(created_at DESC);
CREATE INDEX idx_stock_transactions_type ON stock_transactions(transaction_type);
