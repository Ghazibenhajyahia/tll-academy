-- ============================================================
-- Fix: Allow deleting sessions by cascading session_results FK
-- Run in Supabase SQL Editor
-- ============================================================

-- Drop the existing FK constraint and re-add with ON DELETE CASCADE
ALTER TABLE session_results DROP CONSTRAINT IF EXISTS session_results_session_id_fkey;
ALTER TABLE session_results
  ADD CONSTRAINT session_results_session_id_fkey
  FOREIGN KEY (session_id) REFERENCES sessions(id) ON DELETE CASCADE;
