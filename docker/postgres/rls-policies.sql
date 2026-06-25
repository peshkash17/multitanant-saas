-- ============================================================
-- PostgreSQL Row-Level Security (RLS) Policies
-- Multi-Tenant SaaS Workspace — ALL TABLES
-- ============================================================
--
-- Prerequisites: tables must exist (run backend once with DB_SYNCHRONIZE=true)
--
-- Supabase: run this entire file in SQL Editor (skip optional saas_app block at bottom)
-- Local Docker: tables + init.sql first, then this script
--
-- Session context is set per request by NestJS RlsInterceptor:
--   SELECT set_current_org('<organization-uuid>');
--
-- When app.current_org_id is not set (login, register, list orgs), policies
-- allow access so auth flows continue to work — app layer still enforces RBAC.
-- ============================================================

-- ── Helper functions ──────────────────────────────────────────
CREATE OR REPLACE FUNCTION set_current_org(org_id TEXT)
RETURNS VOID AS $$
BEGIN
  PERFORM set_config('app.current_org_id', COALESCE(org_id, ''), TRUE);
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

-- Members of the active organization (used by users / refresh_tokens policies)
CREATE OR REPLACE FUNCTION current_org_member_user_ids()
RETURNS SETOF UUID AS $$
  SELECT "userId"
  FROM memberships
  WHERE "organizationId" = get_current_org_id();
$$ LANGUAGE sql STABLE;

-- ── Idempotent policy reset helper ────────────────────────────
CREATE OR REPLACE FUNCTION drop_policy_if_exists(p_table TEXT, p_policy TEXT)
RETURNS VOID AS $$
BEGIN
  EXECUTE format('DROP POLICY IF EXISTS %I ON %I', p_policy, p_table);
EXCEPTION WHEN undefined_table THEN
  NULL;
END;
$$ LANGUAGE plpgsql;

-- ── ORGANIZATIONS ───────────────────────────────────────────
SELECT drop_policy_if_exists('organizations', 'organizations_tenant_isolation');
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations FORCE ROW LEVEL SECURITY;

CREATE POLICY organizations_tenant_isolation ON organizations
  FOR ALL
  USING (
    id = get_current_org_id()
    OR get_current_org_id() IS NULL
  )
  WITH CHECK (
    id = get_current_org_id()
    OR get_current_org_id() IS NULL
  );

-- ── USERS (visible to members of the current org) ───────────
SELECT drop_policy_if_exists('users', 'users_tenant_isolation');
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE users FORCE ROW LEVEL SECURITY;

CREATE POLICY users_tenant_isolation ON users
  FOR ALL
  USING (
    get_current_org_id() IS NULL
    OR id IN (SELECT current_org_member_user_ids())
  )
  WITH CHECK (
    get_current_org_id() IS NULL
    OR id IN (SELECT current_org_member_user_ids())
  );

-- ── MEMBERSHIPS ─────────────────────────────────────────────
SELECT drop_policy_if_exists('memberships', 'memberships_tenant_isolation');
SELECT drop_policy_if_exists('memberships', 'memberships_write_unrestricted');
SELECT drop_policy_if_exists('memberships', 'memberships_update_unrestricted');
SELECT drop_policy_if_exists('memberships', 'memberships_delete_unrestricted');
ALTER TABLE memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE memberships FORCE ROW LEVEL SECURITY;

CREATE POLICY memberships_tenant_isolation ON memberships
  FOR ALL
  USING (
    "organizationId" = get_current_org_id()
    OR get_current_org_id() IS NULL
  )
  WITH CHECK (
    "organizationId" = get_current_org_id()
    OR get_current_org_id() IS NULL
  );

-- ── PROJECTS ────────────────────────────────────────────────
SELECT drop_policy_if_exists('projects', 'projects_tenant_isolation');
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE projects FORCE ROW LEVEL SECURITY;

CREATE POLICY projects_tenant_isolation ON projects
  FOR ALL
  USING (
    "organizationId" = get_current_org_id()
    OR get_current_org_id() IS NULL
  )
  WITH CHECK (
    "organizationId" = get_current_org_id()
    OR get_current_org_id() IS NULL
  );

-- ── TASKS (via parent project org) ──────────────────────────
SELECT drop_policy_if_exists('tasks', 'tasks_tenant_isolation');
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks FORCE ROW LEVEL SECURITY;

CREATE POLICY tasks_tenant_isolation ON tasks
  FOR ALL
  USING (
    get_current_org_id() IS NULL
    OR "projectId" IN (
      SELECT id FROM projects
      WHERE "organizationId" = get_current_org_id()
    )
  )
  WITH CHECK (
    get_current_org_id() IS NULL
    OR "projectId" IN (
      SELECT id FROM projects
      WHERE "organizationId" = get_current_org_id()
    )
  );

-- ── PAYMENTS ────────────────────────────────────────────────
SELECT drop_policy_if_exists('payments', 'payments_tenant_isolation');
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments FORCE ROW LEVEL SECURITY;

CREATE POLICY payments_tenant_isolation ON payments
  FOR ALL
  USING (
    "organizationId" = get_current_org_id()::text
    OR get_current_org_id() IS NULL
  )
  WITH CHECK (
    "organizationId" = get_current_org_id()::text
    OR get_current_org_id() IS NULL
  );

-- ── AUDIT LOGS ──────────────────────────────────────────────
SELECT drop_policy_if_exists('audit_logs', 'audit_logs_tenant_isolation');
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs FORCE ROW LEVEL SECURITY;

CREATE POLICY audit_logs_tenant_isolation ON audit_logs
  FOR ALL
  USING (
    get_current_org_id() IS NULL
    OR "organizationId" = get_current_org_id()::text
  )
  WITH CHECK (
    get_current_org_id() IS NULL
    OR "organizationId" = get_current_org_id()::text
  );

-- ── REFRESH TOKENS (scoped via org membership of token owner) ─
SELECT drop_policy_if_exists('refresh_tokens', 'refresh_tokens_tenant_isolation');
ALTER TABLE refresh_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE refresh_tokens FORCE ROW LEVEL SECURITY;

CREATE POLICY refresh_tokens_tenant_isolation ON refresh_tokens
  FOR ALL
  USING (
    get_current_org_id() IS NULL
    OR "userId" IN (SELECT current_org_member_user_ids())
  )
  WITH CHECK (
    get_current_org_id() IS NULL
    OR "userId" IN (SELECT current_org_member_user_ids())
  );

-- ── Verify RLS status ───────────────────────────────────────
SELECT
  c.relname AS table_name,
  c.relrowsecurity AS rls_enabled,
  c.relforcerowsecurity AS rls_forced
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE n.nspname = 'public'
  AND c.relkind = 'r'
  AND c.relname IN (
    'organizations', 'users', 'memberships', 'projects',
    'tasks', 'payments', 'audit_logs', 'refresh_tokens'
  )
ORDER BY c.relname;

-- ── OPTIONAL: dedicated app role (local Docker only — skip on Supabase) ──
-- DO $$
-- BEGIN
--   IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'saas_app') THEN
--     CREATE ROLE saas_app LOGIN PASSWORD 'app_password_change_in_prod';
--   END IF;
-- END
-- $$;
-- GRANT CONNECT ON DATABASE current_database() TO saas_app;  -- use explicit DB name
-- GRANT USAGE ON SCHEMA public TO saas_app;
-- GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO saas_app;
-- GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO saas_app;
