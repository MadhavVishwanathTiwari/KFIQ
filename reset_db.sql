-- ============================================================
--  HARD RESET of the database to a blank slate so that the
--  Drizzle schema (src/lib/db/schema.ts) becomes the single
--  source of truth. Run this ONLY against a throwaway/test DB.
--
--  After this, `npm run db:push` recreates every table/enum
--  cleanly from Drizzle with no citext/view/constraint drift.
--
--  Supabase note: extensions live in the `extensions` schema,
--  so dropping `public` keeps gen_random_uuid() etc. available.
--
--  Apply:  psql "$DATABASE_URL_DIRECT" -f reset_db.sql
-- ============================================================

DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
