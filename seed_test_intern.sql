-- Seed data for local onboarding flow testing.
-- Run after kfiq_schema.sql

INSERT INTO cohorts (id, name, description, is_active)
VALUES (
  '11111111-1111-1111-1111-111111111111',
  'Test Cohort',
  'Initial test cohort for dashboard onboarding',
  TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO users (id, email, role, password_hash)
VALUES (
  '22222222-2222-2222-2222-222222222222',
  'intern@example.com',
  'intern',
  NULL
)
ON CONFLICT DO NOTHING;

INSERT INTO interns (
  id,
  user_id,
  full_name,
  college,
  course_type,
  field_of_interest,
  goal,
  cohort_id,
  resume_parse_status
)
VALUES (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'Test Intern',
  'Example University',
  'B.Tech',
  'Software / Tech',
  'Land a full-time SWE role after graduation',
  '11111111-1111-1111-1111-111111111111',
  'not_uploaded'
)
ON CONFLICT DO NOTHING;
