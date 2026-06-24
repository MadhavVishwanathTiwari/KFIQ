-- Adds the onboarding completion gate used by the dashboard.
-- The dashboard unlocks only once interns.onboarding_completed_at is set;
-- it stays NULL until the intern clicks "Finish & go to dashboard".
--
-- Apply via the Supabase SQL editor, psql, or `npm run db:push`.

ALTER TABLE interns
    ADD COLUMN IF NOT EXISTS onboarding_completed_at TIMESTAMPTZ;
