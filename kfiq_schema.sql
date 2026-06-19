-- ============================================================
--  KFIQ — PostgreSQL Schema
--  Generated for: Kfiq Internship Platform
-- ============================================================

-- Enable useful extensions
CREATE EXTENSION IF NOT EXISTS "pgcrypto";   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS "citext";     -- case-insensitive email

-- ============================================================
--  ENUMS
-- ============================================================

CREATE TYPE user_role AS ENUM (
    'intern',
    'admin',
    'task_assigner',
    'task_overseer',
    'campus_ambassador'
);

CREATE TYPE course_type AS ENUM (
    'B.Tech',
    'B.Sc',
    'B.Com',
    'BBA',
    'BA',
    'M.Tech',
    'M.Sc',
    'MBA',
    'MCA',
    'PhD',
    'Diploma',
    'Other'
);

CREATE TYPE resume_parse_status AS ENUM (
    'not_uploaded',
    'pending',
    'processing',
    'done',
    'failed'
);

CREATE TYPE profile_data_source AS ENUM (
    'resume',   -- came from resume parser
    'manual'    -- intern added it themselves
);

CREATE TYPE application_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);

CREATE TYPE task_assignment_status AS ENUM (
    'not_started',
    'in_progress',
    'submitted',
    'approved',
    'rejected'
);

CREATE TYPE submission_review_status AS ENUM (
    'pending',
    'approved',
    'rejected'
);


-- ============================================================
--  SKILLS  (master list)
-- ============================================================

CREATE TABLE skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        CITEXT NOT NULL UNIQUE,          -- e.g. "React", "Python", "Figma"
    category    TEXT,                            -- e.g. "Frontend", "Data", "Design"
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);


-- ============================================================
--  COHORTS
-- ============================================================

CREATE TABLE cohorts (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name        TEXT NOT NULL,                   -- "Summer 2025", "Initial Cohort", etc.
    description TEXT,
    starts_at   DATE,
    ends_at     DATE,
    is_active   BOOLEAN NOT NULL DEFAULT TRUE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT cohort_dates_valid CHECK (
        ends_at IS NULL OR starts_at IS NULL OR ends_at >= starts_at
    )
);


-- ============================================================
--  USERS  (single auth table for all roles)
-- ============================================================

CREATE TABLE users (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email               CITEXT NOT NULL UNIQUE,
    password_hash       TEXT,                    -- NULL until intern sets password post-signup
    role                user_role NOT NULL,
    is_active           BOOLEAN NOT NULL DEFAULT TRUE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email  ON users (email);
CREATE INDEX idx_users_role   ON users (role);


-- ============================================================
--  CAMPUS AMBASSADORS
-- ============================================================

CREATE TABLE campus_ambassadors (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id         UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    full_name       TEXT NOT NULL,
    university      TEXT NOT NULL,
    phone           TEXT,
    referral_code   TEXT NOT NULL UNIQUE,        -- auto-generated, used in intern signup URL/form
    referral_count  INT NOT NULL DEFAULT 0,      -- denormalised for leaderboard speed
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ambassador_referral_code ON campus_ambassadors (referral_code);
CREATE INDEX idx_ambassador_leaderboard   ON campus_ambassadors (referral_count DESC);


-- ============================================================
--  INTERNS
-- ============================================================

CREATE TABLE interns (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id             UUID NOT NULL UNIQUE REFERENCES users (id) ON DELETE CASCADE,
    full_name           TEXT NOT NULL,
    college             TEXT NOT NULL,
    course_type         course_type NOT NULL,
    field_of_interest   TEXT NOT NULL,           -- e.g. "Web Development", "Data Science"
    goal                TEXT NOT NULL,           -- intern's stated goal
    cohort_id           UUID REFERENCES cohorts (id) ON DELETE SET NULL,
    referred_by         UUID REFERENCES campus_ambassadors (id) ON DELETE SET NULL,

    -- Resume
    resume_url          TEXT,                    -- object storage URL
    resume_parse_status resume_parse_status NOT NULL DEFAULT 'not_uploaded',
    resume_parsed_at    TIMESTAMPTZ,

    -- Task Overseer eligibility (manual promotion by admin)
    is_task_overseer    BOOLEAN NOT NULL DEFAULT FALSE,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_interns_cohort      ON interns (cohort_id);
CREATE INDEX idx_interns_referred_by ON interns (referred_by);


-- ============================================================
--  INTERN PROFILE DATA  (from resume or manually added)
-- ============================================================

-- Skills the intern has
CREATE TABLE intern_skills (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id   UUID NOT NULL REFERENCES interns (id) ON DELETE CASCADE,
    skill_id    UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    source      profile_data_source NOT NULL DEFAULT 'manual',
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    UNIQUE (intern_id, skill_id)
);

-- Certifications
CREATE TABLE intern_certifications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id       UUID NOT NULL REFERENCES interns (id) ON DELETE CASCADE,
    name            TEXT NOT NULL,
    issuing_org     TEXT,
    issued_date     DATE,
    expiry_date     DATE,
    credential_url  TEXT,
    source          profile_data_source NOT NULL DEFAULT 'manual',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Education history
CREATE TABLE intern_education (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id       UUID NOT NULL REFERENCES interns (id) ON DELETE CASCADE,
    institution     TEXT NOT NULL,
    degree          TEXT,
    field_of_study  TEXT,
    start_year      SMALLINT,
    end_year        SMALLINT,
    grade           TEXT,                        -- CGPA, percentage, etc.
    source          profile_data_source NOT NULL DEFAULT 'manual',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Past internship experience
CREATE TABLE intern_past_internships (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id       UUID NOT NULL REFERENCES interns (id) ON DELETE CASCADE,
    company         TEXT NOT NULL,
    role            TEXT,
    start_date      DATE,
    end_date        DATE,
    description     TEXT,
    source          profile_data_source NOT NULL DEFAULT 'manual',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Projects
CREATE TABLE intern_projects (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id       UUID NOT NULL REFERENCES interns (id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    tech_stack      TEXT[],                      -- ["React", "Node.js", "PostgreSQL"]
    project_url     TEXT,
    start_date      DATE,
    end_date        DATE,
    source          profile_data_source NOT NULL DEFAULT 'manual',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_intern_skills_intern         ON intern_skills (intern_id);
CREATE INDEX idx_intern_certs_intern          ON intern_certifications (intern_id);
CREATE INDEX idx_intern_education_intern      ON intern_education (intern_id);
CREATE INDEX idx_intern_past_intern_intern    ON intern_past_internships (intern_id);
CREATE INDEX idx_intern_projects_intern       ON intern_projects (intern_id);


-- ============================================================
--  TASK GROUPS
--  A certificate is awarded per task group completion.
-- ============================================================

CREATE TABLE task_groups (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    cohort_id       UUID REFERENCES cohorts (id) ON DELETE SET NULL,
    created_by      UUID NOT NULL REFERENCES users (id),   -- admin or task_assigner
    title           TEXT NOT NULL,
    description     TEXT,
    field           TEXT NOT NULL,                         -- "Web Development", "Data Science", etc.
    is_open         BOOLEAN NOT NULL DEFAULT TRUE,         -- interns can apply while open
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Skills required for the task group (used for intern matching on apply)
CREATE TABLE task_group_skills (
    task_group_id   UUID NOT NULL REFERENCES task_groups (id) ON DELETE CASCADE,
    skill_id        UUID NOT NULL REFERENCES skills (id) ON DELETE CASCADE,
    PRIMARY KEY (task_group_id, skill_id)
);

CREATE INDEX idx_task_groups_cohort    ON task_groups (cohort_id);
CREATE INDEX idx_task_groups_field     ON task_groups (field);


-- ============================================================
--  TASK SUBGROUPS
--  Optional mid-level grouping within a task group.
--  sequence_order: controls ordering relative to other subgroups.
--  can_run_concurrent: if TRUE this subgroup starts at the same
--  time as the previous sequence_order level (parallel tracks).
-- ============================================================

CREATE TABLE task_subgroups (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_group_id       UUID NOT NULL REFERENCES task_groups (id) ON DELETE CASCADE,
    title               TEXT NOT NULL,
    description         TEXT,
    sequence_order      SMALLINT NOT NULL DEFAULT 1,
    can_run_concurrent  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_task_subgroups_group ON task_subgroups (task_group_id, sequence_order);


-- ============================================================
--  TASKS
--  Belongs to EITHER a task_group (direct) OR a task_subgroup.
--  Enforced via CHECK constraint — never both, never neither.
-- ============================================================

CREATE TABLE tasks (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    task_group_id       UUID REFERENCES task_groups (id) ON DELETE CASCADE,
    task_subgroup_id    UUID REFERENCES task_subgroups (id) ON DELETE CASCADE,
    created_by          UUID NOT NULL REFERENCES users (id),
    title               TEXT NOT NULL,
    description         TEXT,
    field               TEXT,
    required_skills     UUID[],                  -- skill IDs for quick display; not FK-enforced in array
    sequence_order      SMALLINT NOT NULL DEFAULT 1,
    can_run_concurrent  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- A task must belong to exactly one parent
    CONSTRAINT task_parent_check CHECK (
        (task_group_id IS NOT NULL AND task_subgroup_id IS NULL)
        OR
        (task_group_id IS NULL AND task_subgroup_id IS NOT NULL)
    )
);

CREATE INDEX idx_tasks_group    ON tasks (task_group_id);
CREATE INDEX idx_tasks_subgroup ON tasks (task_subgroup_id);


-- ============================================================
--  APPLICATIONS
--  An intern applies to a task group.
--  On approval, admin assigns specific tasks (intern_task_assignments).
--  Assignment happens AT the point of approval — not before, not after.
-- ============================================================

CREATE TABLE applications (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id       UUID NOT NULL REFERENCES interns (id) ON DELETE CASCADE,
    task_group_id   UUID NOT NULL REFERENCES task_groups (id) ON DELETE CASCADE,
    status          application_status NOT NULL DEFAULT 'pending',
    applied_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    reviewed_at     TIMESTAMPTZ,
    reviewed_by     UUID REFERENCES users (id),              -- admin who approved/rejected
    rejection_note  TEXT,                                    -- optional note if rejected

    -- One application per intern per task group
    UNIQUE (intern_id, task_group_id)
);

CREATE INDEX idx_applications_intern     ON applications (intern_id);
CREATE INDEX idx_applications_group      ON applications (task_group_id);
CREATE INDEX idx_applications_status     ON applications (status);


-- ============================================================
--  INTERN TASK ASSIGNMENTS
--  Created by admin AT the moment of application approval.
--  One intern per task (no two active interns on the same task).
-- ============================================================

CREATE TABLE intern_task_assignments (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    application_id  UUID NOT NULL REFERENCES applications (id) ON DELETE CASCADE,
    intern_id       UUID NOT NULL REFERENCES interns (id) ON DELETE CASCADE,
    task_id         UUID NOT NULL REFERENCES tasks (id) ON DELETE CASCADE,
    assigned_by     UUID NOT NULL REFERENCES users (id),
    status          task_assignment_status NOT NULL DEFAULT 'not_started',
    assigned_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    -- One intern per task
    UNIQUE (task_id),

    -- One assignment per intern per task (redundant with above but explicit)
    UNIQUE (intern_id, task_id)
);

CREATE INDEX idx_assignments_intern      ON intern_task_assignments (intern_id);
CREATE INDEX idx_assignments_task        ON intern_task_assignments (task_id);
CREATE INDEX idx_assignments_application ON intern_task_assignments (application_id);
CREATE INDEX idx_assignments_status      ON intern_task_assignments (status);


-- ============================================================
--  TASK SUBMISSIONS
--  Intern marks a task as done. Admin or Task Overseer reviews.
-- ============================================================

CREATE TABLE task_submissions (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assignment_id   UUID NOT NULL REFERENCES intern_task_assignments (id) ON DELETE CASCADE,
    intern_id       UUID NOT NULL REFERENCES interns (id) ON DELETE CASCADE,
    notes           TEXT,                        -- intern's submission notes
    attachment_urls TEXT[],                      -- links to deliverables (GitHub, Figma, Drive, etc.)
    submitted_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_status   submission_review_status NOT NULL DEFAULT 'pending',
    reviewed_by     UUID REFERENCES users (id),  -- admin or task_overseer
    reviewed_at     TIMESTAMPTZ,

    -- Only one active submission per assignment at a time
    UNIQUE (assignment_id)
);

CREATE INDEX idx_submissions_assignment  ON task_submissions (assignment_id);
CREATE INDEX idx_submissions_intern      ON task_submissions (intern_id);
CREATE INDEX idx_submissions_status      ON task_submissions (review_status);


-- ============================================================
--  TASK FEEDBACK
--  Admin or Task Overseer gives feedback on a submission.
--  Can exist on both approved and rejected submissions.
-- ============================================================

CREATE TABLE task_feedback (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id   UUID NOT NULL REFERENCES task_submissions (id) ON DELETE CASCADE,
    given_by        UUID NOT NULL REFERENCES users (id),
    feedback_text   TEXT NOT NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_feedback_submission ON task_feedback (submission_id);


-- ============================================================
--  CERTIFICATES
--  Issued when all tasks assigned to an intern within a task group
--  have a submission_review_status of 'approved'.
--  QR code points to a public verification endpoint using verify_token.
-- ============================================================

CREATE TABLE certificates (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    intern_id       UUID NOT NULL REFERENCES interns (id) ON DELETE CASCADE,
    task_group_id   UUID NOT NULL REFERENCES task_groups (id) ON DELETE CASCADE,
    issued_by       UUID NOT NULL REFERENCES users (id),     -- admin who triggered issuance
    issued_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    verify_token    UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),  -- what the QR code encodes
    qr_code_url     TEXT,                                    -- stored QR image URL
    pdf_url         TEXT,                                    -- stored certificate PDF URL
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    revoked_at      TIMESTAMPTZ,
    revoke_reason   TEXT,

    -- One certificate per intern per task group
    UNIQUE (intern_id, task_group_id)
);

CREATE INDEX idx_certificates_intern       ON certificates (intern_id);
CREATE INDEX idx_certificates_task_group   ON certificates (task_group_id);
CREATE INDEX idx_certificates_verify_token ON certificates (verify_token);  -- QR lookup must be fast


-- ============================================================
--  UPDATED_AT TRIGGER  (auto-update timestamp on row change)
-- ============================================================

CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_ambassadors_updated_at
    BEFORE UPDATE ON campus_ambassadors
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_interns_updated_at
    BEFORE UPDATE ON interns
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_task_groups_updated_at
    BEFORE UPDATE ON task_groups
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_task_subgroups_updated_at
    BEFORE UPDATE ON task_subgroups
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_tasks_updated_at
    BEFORE UPDATE ON tasks
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_assignments_updated_at
    BEFORE UPDATE ON intern_task_assignments
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_feedback_updated_at
    BEFORE UPDATE ON task_feedback
    FOR EACH ROW EXECUTE FUNCTION set_updated_at();


-- ============================================================
--  REFERRAL COUNT TRIGGER
--  Keeps campus_ambassadors.referral_count in sync automatically
--  whenever an intern with referred_by is inserted or updated.
-- ============================================================

CREATE OR REPLACE FUNCTION sync_referral_count()
RETURNS TRIGGER AS $$
BEGIN
    -- Decrement old ambassador's count if referral changed
    IF TG_OP = 'UPDATE' AND OLD.referred_by IS DISTINCT FROM NEW.referred_by THEN
        IF OLD.referred_by IS NOT NULL THEN
            UPDATE campus_ambassadors
            SET referral_count = referral_count - 1
            WHERE id = OLD.referred_by;
        END IF;
    END IF;

    -- Increment new ambassador's count
    IF NEW.referred_by IS NOT NULL THEN
        IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND OLD.referred_by IS DISTINCT FROM NEW.referred_by) THEN
            UPDATE campus_ambassadors
            SET referral_count = referral_count + 1
            WHERE id = NEW.referred_by;
        END IF;
    END IF;

    -- Handle delete
    IF TG_OP = 'DELETE' AND OLD.referred_by IS NOT NULL THEN
        UPDATE campus_ambassadors
        SET referral_count = referral_count - 1
        WHERE id = OLD.referred_by;
        RETURN OLD;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_intern_referral_count
    AFTER INSERT OR UPDATE OF referred_by OR DELETE ON interns
    FOR EACH ROW EXECUTE FUNCTION sync_referral_count();


-- ============================================================
--  USEFUL VIEWS
-- ============================================================

-- Leaderboard: ambassadors ranked by referral count
CREATE VIEW ambassador_leaderboard AS
SELECT
    ca.id,
    ca.full_name,
    ca.university,
    ca.referral_code,
    ca.referral_count,
    RANK() OVER (ORDER BY ca.referral_count DESC) AS rank
FROM campus_ambassadors ca
JOIN users u ON u.id = ca.user_id
WHERE u.is_active = TRUE
ORDER BY ca.referral_count DESC;


-- Intern task group progress: how many tasks done vs total per group
CREATE VIEW intern_group_progress AS
SELECT
    a.intern_id,
    a.task_group_id,
    tg.title AS group_title,
    COUNT(ita.id)                                                  AS total_tasks,
    COUNT(ita.id) FILTER (WHERE ita.status = 'approved')           AS approved_tasks,
    COUNT(ita.id) FILTER (WHERE ita.status = 'submitted')          AS pending_review,
    COUNT(ita.id) FILTER (WHERE ita.status IN ('not_started','in_progress')) AS remaining_tasks,
    ROUND(
        COUNT(ita.id) FILTER (WHERE ita.status = 'approved') * 100.0
        / NULLIF(COUNT(ita.id), 0),
    2) AS completion_pct
FROM applications a
JOIN task_groups tg ON tg.id = a.task_group_id
LEFT JOIN intern_task_assignments ita ON ita.application_id = a.id
WHERE a.status = 'approved'
GROUP BY a.intern_id, a.task_group_id, tg.title;


-- Certificate eligibility: interns where all assigned tasks in a group are approved
-- (Application layer uses this to trigger certificate generation)
CREATE VIEW certificate_eligible AS
SELECT
    igp.intern_id,
    igp.task_group_id,
    igp.group_title,
    igp.total_tasks,
    igp.approved_tasks
FROM intern_group_progress igp
LEFT JOIN certificates c
    ON c.intern_id = igp.intern_id
    AND c.task_group_id = igp.task_group_id
WHERE igp.total_tasks > 0
  AND igp.total_tasks = igp.approved_tasks
  AND c.id IS NULL;              -- certificate not yet issued


-- ============================================================
--  COMMENTS  (for future devs reading the schema)
-- ============================================================

COMMENT ON TABLE users IS
    'Single auth table for all roles. password_hash is NULL for interns until they set it post-signup.';

COMMENT ON TABLE campus_ambassadors IS
    'Ambassador-specific profile. referral_code is auto-generated and given to ambassadors to share.';

COMMENT ON TABLE interns IS
    'Intern-specific profile. is_task_overseer is manually set by admin — not auto-promoted.';

COMMENT ON TABLE task_groups IS
    'Top-level unit. One certificate is issued per completed task group per intern.';

COMMENT ON TABLE task_subgroups IS
    'Optional mid-level grouping within a task group. can_run_concurrent=TRUE means this subgroup runs in parallel with the previous sequence level.';

COMMENT ON TABLE tasks IS
    'Atomic unit of work. Must belong to EITHER task_group OR task_subgroup, enforced by CHECK constraint.';

COMMENT ON TABLE applications IS
    'Intern applies to a task group. On approval, admin assigns specific tasks via intern_task_assignments in the same action.';

COMMENT ON TABLE intern_task_assignments IS
    'One intern per task (UNIQUE on task_id). Created at application approval time. Tracks individual task progress.';

COMMENT ON TABLE task_submissions IS
    'Intern marks a task done. Admin or Task Overseer reviews. One active submission per assignment.';

COMMENT ON TABLE task_feedback IS
    'Feedback on a submission from admin or task_overseer. Can exist on both approved and rejected submissions.';

COMMENT ON TABLE certificates IS
    'Issued when all tasks in a group assigned to an intern are approved. verify_token is what the QR code encodes — hits a public /verify/:token endpoint.';

COMMENT ON COLUMN intern_task_assignments.status IS
    'Flow: not_started → in_progress → submitted → approved | rejected. Rejection allows resubmission.';

COMMENT ON COLUMN tasks.required_skills IS
    'Array of skill UUIDs for display convenience. Canonical skill data lives in the skills table.';

COMMENT ON COLUMN interns.is_task_overseer IS
    'Manually promoted by admin. Gives permission to review task submissions and give feedback.';
