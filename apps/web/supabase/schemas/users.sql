CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  photo_path TEXT,
  selected_theme TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at DESC);

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Enable insert for admins only"
  ON users
  AS PERMISSIVE
  FOR INSERT
  TO supabase_admin
  WITH CHECK (true);

CREATE POLICY "Enable read access for admins only"
  ON users
  AS PERMISSIVE
  FOR SELECT
  TO supabase_admin
  USING (true);