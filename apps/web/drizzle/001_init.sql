-- enable uuid via pgcrypto (or adjust if using uuid-ossp)
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS reservations (
  id text PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name text NOT NULL,
  name_lower text NOT NULL,
  address text NOT NULL,
  address_lower text NOT NULL,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Uniqueness: name_lower unique, and each (address_lower, name_lower) pair unique
CREATE UNIQUE INDEX IF NOT EXISTS ux_res_name_lower ON reservations (name_lower);
CREATE UNIQUE INDEX IF NOT EXISTS ux_res_addr_name ON reservations (address_lower, name_lower);
