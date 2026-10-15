-- Migration: 0001_auth_and_tables
-- 1. ALTER users: agregar campos de autenticación y Google OAuth
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS email VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS provider VARCHAR(20) DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS google_id VARCHAR(100) UNIQUE,
  ADD COLUMN IF NOT EXISTS avatar_url VARCHAR(500),
  ADD COLUMN IF NOT EXISTS is_email_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP;

-- 2. Crear tabla login_history (auditoría de accesos)
CREATE TABLE IF NOT EXISTS login_history (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email VARCHAR(100),
  login_method VARCHAR(20) NOT NULL, -- 'local', 'google'
  ip_address VARCHAR(45),
  user_agent TEXT,
  status VARCHAR(20) NOT NULL, -- 'success', 'failed'
  failure_reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_login_history_user_id ON login_history(user_id);
CREATE INDEX IF NOT EXISTS idx_login_history_created_at ON login_history(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_history_status ON login_history(status);

-- 3. Crear tabla tables (mesas del salón)
CREATE TABLE IF NOT EXISTS tables (
  id SERIAL PRIMARY KEY,
  number VARCHAR(20) NOT NULL UNIQUE,
  name VARCHAR(50),
  capacity INTEGER DEFAULT 4,
  position_x INTEGER,
  position_y INTEGER,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_tables_is_active ON tables(is_active);

-- 4. Ampliar orders con soporte de mesas y estados completos
ALTER TABLE orders
  DROP CONSTRAINT IF EXISTS orders_status_check;

ALTER TABLE orders
  ADD CONSTRAINT orders_status_check
  CHECK (status IN ('pending', 'assigned', 'in_progress', 'ready_to_deliver', 'delivered', 'paid', 'cancelled'));

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS table_id INTEGER REFERENCES tables(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_orders_table_id ON orders(table_id);
