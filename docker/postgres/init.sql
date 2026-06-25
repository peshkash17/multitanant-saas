-- Initial PostgreSQL setup for SaaS Workspace
-- TypeORM handles table creation via synchronize: true in dev
-- This file sets up extensions and RLS foundation

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Row-Level Security helper functions (also defined in rls-policies.sql)
CREATE OR REPLACE FUNCTION set_current_org(org_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_org_id', org_id, TRUE);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION get_current_org_id()
RETURNS UUID AS $$
DECLARE
  v TEXT;
BEGIN
  v := current_setting('app.current_org_id', TRUE);
  IF v IS NULL OR v = '' THEN
    RETURN NULL;
  END IF;
  RETURN v::UUID;
EXCEPTION WHEN OTHERS THEN
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;
