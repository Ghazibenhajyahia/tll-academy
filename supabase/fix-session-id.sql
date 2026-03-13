-- ============================================================
-- Fix: Add session_id to session_results (references sessions.id)
-- This prevents results from breaking when sessions are reordered.
-- Run AFTER sessions-schema.sql
-- ============================================================

-- Add session_id column (nullable first for migration)
ALTER TABLE session_results ADD COLUMN IF NOT EXISTS session_id int REFERENCES sessions(id);

-- Migrate existing data: session_index 0 → session with sort_order 0, etc.
UPDATE session_results sr
SET session_id = s.id
FROM sessions s
WHERE s.sort_order = sr.session_index
  AND sr.session_id IS NULL;

-- Make NOT NULL after migration
ALTER TABLE session_results ALTER COLUMN session_id SET NOT NULL;
