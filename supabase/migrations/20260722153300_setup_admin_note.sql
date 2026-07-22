-- Migration: Setup admin users
-- This migration grants admin role to both admin users after they are created via Supabase Auth.
-- The actual user accounts must be created via the setup script: scripts/setup-admins.mjs

-- After running scripts/setup-admins.mjs, the user UUIDs will be inserted here automatically.
-- This file is a placeholder — the script handles the inserts directly via the admin API.

-- Ensure the has_role function is only callable by authenticated users (already done in previous migration)
-- No additional SQL needed here; user_roles rows are inserted by the setup script.
