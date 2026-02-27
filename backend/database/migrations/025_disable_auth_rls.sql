-- Migration 025: Disable RLS on Auth Schema Tables
-- Date: February 27, 2026
-- 
-- CRITICAL FIX: Auth schema tables should NOT have RLS enabled.
-- Supabase Auth service manages these tables internally and needs unrestricted access.
-- 
-- Issue: RLS was accidentally enabled on auth.users, auth.identities, auth.sessions,
-- and auth.refresh_tokens, causing "Database error querying schema" on all login attempts.
--
-- This migration must be run with elevated privileges through Supabase Dashboard SQL Editor.
-- ============================================================================

-- Disable RLS on all auth schema tables
ALTER TABLE auth.users DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.identities DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.sessions DISABLE ROW LEVEL SECURITY;
ALTER TABLE auth.refresh_tokens DISABLE ROW LEVEL SECURITY;

-- Verify the fix
SELECT 
    tablename, 
    rowsecurity,
    CASE 
        WHEN rowsecurity THEN '❌ RLS ENABLED (PROBLEM)'
        ELSE '✅ RLS DISABLED (CORRECT)'
    END as status
FROM pg_tables 
WHERE schemaname = 'auth' 
  AND tablename IN ('users', 'identities', 'sessions', 'refresh_tokens')
ORDER BY tablename;

-- Expected output: All tables should show rowsecurity = false

-- ============================================================================
-- IMPORTANT: This migration affects system tables
-- ============================================================================
-- 
-- After applying this migration:
-- 1. All login attempts should work immediately
-- 2. "Database error querying schema" errors should disappear
-- 3. Supabase Auth service will have proper access to auth tables
-- 4. No further auth-related configuration needed
--
-- Note: This MUST be run through Supabase Dashboard SQL Editor
-- Cannot be applied via standard migration tools due to ownership restrictions
-- ============================================================================
