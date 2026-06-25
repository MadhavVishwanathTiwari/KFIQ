-- ============================================================
--  Seed data for testing the ADMIN side end-to-end.
--  Run after the schema is applied (npm run db:push).
--
--  Admin login (after seeding):
--    URL:      /admin/login
--    Email:    admin@kfiq.com   (on the allowlist, KFIQ domain)
--    Password: kfiqadmin123     (pre-hashed below — sign in directly)
--
--  If you'd rather exercise the "claim" flow instead, delete the admin
--  users INSERT below and keep only the admin_allowlist row, then use
--  "Set up your access" on the login page.
-- ============================================================

-- --- Allowlist + admin user -------------------------------------------------
INSERT INTO admin_allowlist (id, email, note)
VALUES (
  'd0000000-0000-0000-0000-000000000001',
  'admin@kfiq.com',
  'Seed admin'
)
ON CONFLICT DO NOTHING;

-- password = 'kfiqadmin123' (bcrypt, cost 10)
INSERT INTO users (id, email, role, password_hash)
VALUES (
  'a0000000-0000-0000-0000-000000000001',
  'admin@kfiq.com',
  'admin',
  '$2b$10$qW8RHIiguV/KuV61kkc1cO081r6szzNMv5n5cfy5ciRxw.W5p76aC'
)
ON CONFLICT DO NOTHING;

-- --- Cohort -----------------------------------------------------------------
INSERT INTO cohorts (id, name, description, is_active)
VALUES (
  'c0000000-0000-0000-0000-000000000001',
  'Initial Cohort',
  'Seed cohort for admin testing',
  TRUE
)
ON CONFLICT DO NOTHING;

-- --- Skills -----------------------------------------------------------------
INSERT INTO skills (id, name, category) VALUES
  ('50000000-0000-0000-0000-000000000001', 'React',      'Frontend'),
  ('50000000-0000-0000-0000-000000000002', 'TypeScript', 'Frontend'),
  ('50000000-0000-0000-0000-000000000003', 'CSS',        'Frontend')
ON CONFLICT DO NOTHING;

-- --- Interns (onboarding already complete) ----------------------------------
INSERT INTO users (id, email, role, password_hash) VALUES
  ('a0000000-0000-0000-0000-000000000002', 'asha@example.com', 'intern', NULL),
  ('a0000000-0000-0000-0000-000000000003', 'ben@example.com',  'intern', NULL)
ON CONFLICT DO NOTHING;

INSERT INTO interns (
  id, user_id, full_name, college, course_type, field_of_interest, goal,
  cohort_id, resume_parse_status, onboarding_completed_at
) VALUES
  ('10000000-0000-0000-0000-000000000001', 'a0000000-0000-0000-0000-000000000002',
   'Asha Rao', 'Example University', 'B.Tech', 'Web Development',
   'Become a frontend engineer', 'c0000000-0000-0000-0000-000000000001',
   'not_uploaded', NOW()),
  ('10000000-0000-0000-0000-000000000002', 'a0000000-0000-0000-0000-000000000003',
   'Ben Cohen', 'Example University', 'B.Tech', 'Web Development',
   'Ship production React apps', 'c0000000-0000-0000-0000-000000000001',
   'not_uploaded', NOW())
ON CONFLICT DO NOTHING;

-- --- Task group + skills + subgroup -----------------------------------------
INSERT INTO task_groups (id, cohort_id, created_by, title, description, field, is_open)
VALUES (
  '60000000-0000-0000-0000-000000000001',
  'c0000000-0000-0000-0000-000000000001',
  'a0000000-0000-0000-0000-000000000001',
  'Web Development',
  'Build and ship the marketing site.',
  'Frontend',
  TRUE
)
ON CONFLICT DO NOTHING;

INSERT INTO task_group_skills (task_group_id, skill_id) VALUES
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001'),
  ('60000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000002')
ON CONFLICT DO NOTHING;

INSERT INTO task_subgroups (id, task_group_id, title, description, sequence_order, can_run_concurrent)
VALUES (
  '70000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000001',
  'Landing page',
  'Design and build the landing page.',
  1,
  FALSE
)
ON CONFLICT DO NOTHING;

-- --- Tasks: 2 direct on the group, 2 under the subgroup ---------------------
INSERT INTO tasks (id, task_group_id, task_subgroup_id, created_by, title, description, required_skills, sequence_order)
VALUES
  ('80000000-0000-0000-0000-000000000001', '60000000-0000-0000-0000-000000000001', NULL,
   'a0000000-0000-0000-0000-000000000001', 'Set up the repo', 'Init the Next.js project.',
   ARRAY['50000000-0000-0000-0000-000000000002']::uuid[], 1),
  ('80000000-0000-0000-0000-000000000002', '60000000-0000-0000-0000-000000000001', NULL,
   'a0000000-0000-0000-0000-000000000001', 'Configure CI', 'Add lint + typecheck CI.',
   ARRAY[]::uuid[], 2)
ON CONFLICT DO NOTHING;

INSERT INTO tasks (id, task_group_id, task_subgroup_id, created_by, title, description, required_skills, sequence_order)
VALUES
  ('80000000-0000-0000-0000-000000000003', NULL, '70000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001', 'Design in Figma', 'Create the landing page design.',
   ARRAY[]::uuid[], 1),
  ('80000000-0000-0000-0000-000000000004', NULL, '70000000-0000-0000-0000-000000000001',
   'a0000000-0000-0000-0000-000000000001', 'Build it responsively', 'Code the design, make it responsive.',
   ARRAY['50000000-0000-0000-0000-000000000001','50000000-0000-0000-0000-000000000003']::uuid[], 2)
ON CONFLICT DO NOTHING;

-- --- Applications -----------------------------------------------------------
-- Asha: PENDING — use this to test Approve & assign / Reject.
INSERT INTO applications (id, intern_id, task_group_id, status)
VALUES (
  '90000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000001',
  '60000000-0000-0000-0000-000000000001',
  'pending'
)
ON CONFLICT DO NOTHING;

-- Ben: APPROVED with one assigned task that has a pending submission —
-- approving that submission makes Ben eligible for the certificate.
INSERT INTO applications (id, intern_id, task_group_id, status, reviewed_at, reviewed_by)
VALUES (
  '90000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '60000000-0000-0000-0000-000000000001',
  'approved',
  NOW(),
  'a0000000-0000-0000-0000-000000000001'
)
ON CONFLICT DO NOTHING;

INSERT INTO intern_task_assignments (id, application_id, intern_id, task_id, assigned_by, status)
VALUES (
  'b0000000-0000-0000-0000-000000000001',
  '90000000-0000-0000-0000-000000000002',
  '10000000-0000-0000-0000-000000000002',
  '80000000-0000-0000-0000-000000000003',
  'a0000000-0000-0000-0000-000000000001',
  'submitted'
)
ON CONFLICT DO NOTHING;

INSERT INTO task_submissions (id, assignment_id, intern_id, notes, attachment_urls, review_status)
VALUES (
  'c0000000-0000-0000-0000-0000000000a1',
  'b0000000-0000-0000-0000-000000000001',
  '10000000-0000-0000-0000-000000000002',
  'Figma design done — link attached.',
  ARRAY['https://figma.com/file/example']::text[],
  'pending'
)
ON CONFLICT DO NOTHING;
