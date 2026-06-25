import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  date,
  pgEnum,
  pgTable,
  primaryKey,
  smallint,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "intern",
  "admin",
  "task_assigner",
  "task_overseer",
  "campus_ambassador",
]);

export const courseTypeEnum = pgEnum("course_type", [
  "B.Tech",
  "B.Sc",
  "B.Com",
  "BBA",
  "BA",
  "M.Tech",
  "M.Sc",
  "MBA",
  "MCA",
  "PhD",
  "Diploma",
  "Other",
]);

export const resumeParseStatusEnum = pgEnum("resume_parse_status", [
  "not_uploaded",
  "pending",
  "processing",
  "done",
  "failed",
]);

export const profileDataSourceEnum = pgEnum("profile_data_source", [
  "resume",
  "manual",
]);

export const applicationStatusEnum = pgEnum("application_status", [
  "pending",
  "approved",
  "rejected",
]);

export const taskAssignmentStatusEnum = pgEnum("task_assignment_status", [
  "not_started",
  "in_progress",
  "submitted",
  "approved",
  "rejected",
]);

export const submissionReviewStatusEnum = pgEnum("submission_review_status", [
  "pending",
  "approved",
  "rejected",
]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    email: text("email").notNull().unique(),
    passwordHash: text("password_hash"),
    role: userRoleEnum("role").notNull(),
    isActive: boolean("is_active").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_users_email").on(table.email)]
);

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull().unique(),
  category: text("category"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const cohorts = pgTable("cohorts", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  description: text("description"),
  startsAt: date("starts_at"),
  endsAt: date("ends_at"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const campusAmbassadors = pgTable("campus_ambassadors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: uuid("user_id")
    .notNull()
    .unique()
    .references(() => users.id, { onDelete: "cascade" }),
  fullName: text("full_name").notNull(),
  university: text("university").notNull(),
  phone: text("phone"),
  referralCode: text("referral_code").notNull().unique(),
  referralCount: smallint("referral_count").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export const interns = pgTable(
  "interns",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    userId: uuid("user_id")
      .notNull()
      .unique()
      .references(() => users.id, { onDelete: "cascade" }),
    fullName: text("full_name").notNull(),
    // Inside your interns table definition in schema.ts
    phone: text("phone").unique(),
    college: text("college").notNull(),
    courseType: courseTypeEnum("course_type").notNull(),
    fieldOfInterest: text("field_of_interest").notNull(),
    goal: text("goal").notNull(),
    cohortId: uuid("cohort_id").references(() => cohorts.id, {
      onDelete: "set null",
    }),
    referredBy: uuid("referred_by").references(() => campusAmbassadors.id, {
      onDelete: "set null",
    }),
    resumeUrl: text("resume_url"),
    resumeParseStatus: resumeParseStatusEnum("resume_parse_status")
      .notNull()
      .default("not_uploaded"),
    resumeParsedAt: timestamp("resume_parsed_at", { withTimezone: true }),
    onboardingCompletedAt: timestamp("onboarding_completed_at", {
      withTimezone: true,
    }),
    isTaskOverseer: boolean("is_task_overseer").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_interns_cohort").on(table.cohortId),
    index("idx_interns_referred_by").on(table.referredBy),
  ]
);

export const internSkills = pgTable(
  "intern_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => interns.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
    source: profileDataSourceEnum("source").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    unique("intern_skills_intern_id_skill_id").on(table.internId, table.skillId),
    index("idx_intern_skills_intern").on(table.internId),
  ]
);

export const internCertifications = pgTable(
  "intern_certifications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => interns.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    issuingOrg: text("issuing_org"),
    issuedDate: date("issued_date"),
    expiryDate: date("expiry_date"),
    credentialUrl: text("credential_url"),
    source: profileDataSourceEnum("source").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_intern_certs_intern").on(table.internId)]
);

export const internEducation = pgTable(
  "intern_education",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => interns.id, { onDelete: "cascade" }),
    institution: text("institution").notNull(),
    degree: text("degree"),
    fieldOfStudy: text("field_of_study"),
    startYear: smallint("start_year"),
    endYear: smallint("end_year"),
    grade: text("grade"),
    source: profileDataSourceEnum("source").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_intern_education_intern").on(table.internId)]
);

export const internPastInternships = pgTable(
  "intern_past_internships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => interns.id, { onDelete: "cascade" }),
    company: text("company").notNull(),
    role: text("role"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    description: text("description"),
    source: profileDataSourceEnum("source").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_intern_past_intern_intern").on(table.internId)]
);

export const internProjects = pgTable(
  "intern_projects",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => interns.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    techStack: text("tech_stack").array(),
    projectUrl: text("project_url"),
    startDate: date("start_date"),
    endDate: date("end_date"),
    source: profileDataSourceEnum("source").notNull().default("manual"),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_intern_projects_intern").on(table.internId)]
);

/* ================================================================== */
/* TASK GROUPS / SUBGROUPS / TASKS                                     */
/* ================================================================== */

export const taskGroups = pgTable(
  "task_groups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    cohortId: uuid("cohort_id").references(() => cohorts.id, {
      onDelete: "set null",
    }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    field: text("field").notNull(),
    isOpen: boolean("is_open").notNull().default(true),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_task_groups_cohort").on(table.cohortId),
    index("idx_task_groups_field").on(table.field),
  ]
);

export const taskGroupSkills = pgTable(
  "task_group_skills",
  {
    taskGroupId: uuid("task_group_id")
      .notNull()
      .references(() => taskGroups.id, { onDelete: "cascade" }),
    skillId: uuid("skill_id")
      .notNull()
      .references(() => skills.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.taskGroupId, table.skillId] }),
  ]
);

export const taskSubgroups = pgTable(
  "task_subgroups",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskGroupId: uuid("task_group_id")
      .notNull()
      .references(() => taskGroups.id, { onDelete: "cascade" }),
    title: text("title").notNull(),
    description: text("description"),
    sequenceOrder: smallint("sequence_order").notNull().default(1),
    canRunConcurrent: boolean("can_run_concurrent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_task_subgroups_group").on(table.taskGroupId, table.sequenceOrder),
  ]
);

export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    taskGroupId: uuid("task_group_id").references(() => taskGroups.id, {
      onDelete: "cascade",
    }),
    taskSubgroupId: uuid("task_subgroup_id").references(() => taskSubgroups.id, {
      onDelete: "cascade",
    }),
    createdBy: uuid("created_by")
      .notNull()
      .references(() => users.id),
    title: text("title").notNull(),
    description: text("description"),
    field: text("field"),
    requiredSkills: uuid("required_skills").array(),
    sequenceOrder: smallint("sequence_order").notNull().default(1),
    canRunConcurrent: boolean("can_run_concurrent").notNull().default(false),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_tasks_group").on(table.taskGroupId),
    index("idx_tasks_subgroup").on(table.taskSubgroupId),
    // A task must belong to exactly one parent — group OR subgroup, never both.
    check(
      "task_parent_check",
      sql`(${table.taskGroupId} IS NOT NULL AND ${table.taskSubgroupId} IS NULL)
        OR (${table.taskGroupId} IS NULL AND ${table.taskSubgroupId} IS NOT NULL)`
    ),
  ]
);

/* ================================================================== */
/* APPLICATIONS / ASSIGNMENTS / SUBMISSIONS / FEEDBACK                 */
/* ================================================================== */

export const applications = pgTable(
  "applications",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => interns.id, { onDelete: "cascade" }),
    taskGroupId: uuid("task_group_id")
      .notNull()
      .references(() => taskGroups.id, { onDelete: "cascade" }),
    status: applicationStatusEnum("status").notNull().default("pending"),
    appliedAt: timestamp("applied_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    rejectionNote: text("rejection_note"),
  },
  (table) => [
    unique("applications_intern_id_task_group_id").on(
      table.internId,
      table.taskGroupId
    ),
    index("idx_applications_intern").on(table.internId),
    index("idx_applications_group").on(table.taskGroupId),
    index("idx_applications_status").on(table.status),
  ]
);

export const internTaskAssignments = pgTable(
  "intern_task_assignments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    applicationId: uuid("application_id")
      .notNull()
      .references(() => applications.id, { onDelete: "cascade" }),
    internId: uuid("intern_id")
      .notNull()
      .references(() => interns.id, { onDelete: "cascade" }),
    taskId: uuid("task_id")
      .notNull()
      .references(() => tasks.id, { onDelete: "cascade" }),
    assignedBy: uuid("assigned_by")
      .notNull()
      .references(() => users.id),
    status: taskAssignmentStatusEnum("status").notNull().default("not_started"),
    assignedAt: timestamp("assigned_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    // One intern per task (no two interns on the same task).
    unique("intern_task_assignments_task_id").on(table.taskId),
    unique("intern_task_assignments_intern_id_task_id").on(
      table.internId,
      table.taskId
    ),
    index("idx_assignments_intern").on(table.internId),
    index("idx_assignments_task").on(table.taskId),
    index("idx_assignments_application").on(table.applicationId),
    index("idx_assignments_status").on(table.status),
  ]
);

export const taskSubmissions = pgTable(
  "task_submissions",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    assignmentId: uuid("assignment_id")
      .notNull()
      .references(() => internTaskAssignments.id, { onDelete: "cascade" }),
    internId: uuid("intern_id")
      .notNull()
      .references(() => interns.id, { onDelete: "cascade" }),
    notes: text("notes"),
    attachmentUrls: text("attachment_urls").array(),
    submittedAt: timestamp("submitted_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    reviewStatus: submissionReviewStatusEnum("review_status")
      .notNull()
      .default("pending"),
    reviewedBy: uuid("reviewed_by").references(() => users.id),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
  },
  (table) => [
    // Only one active submission per assignment at a time.
    unique("task_submissions_assignment_id").on(table.assignmentId),
    index("idx_submissions_assignment").on(table.assignmentId),
    index("idx_submissions_intern").on(table.internId),
    index("idx_submissions_status").on(table.reviewStatus),
  ]
);

export const taskFeedback = pgTable(
  "task_feedback",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    submissionId: uuid("submission_id")
      .notNull()
      .references(() => taskSubmissions.id, { onDelete: "cascade" }),
    givenBy: uuid("given_by")
      .notNull()
      .references(() => users.id),
    feedbackText: text("feedback_text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [index("idx_feedback_submission").on(table.submissionId)]
);

/* ================================================================== */
/* CERTIFICATES                                                        */
/* ================================================================== */

export const certificates = pgTable(
  "certificates",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    internId: uuid("intern_id")
      .notNull()
      .references(() => interns.id, { onDelete: "cascade" }),
    taskGroupId: uuid("task_group_id")
      .notNull()
      .references(() => taskGroups.id, { onDelete: "cascade" }),
    issuedBy: uuid("issued_by")
      .notNull()
      .references(() => users.id),
    issuedAt: timestamp("issued_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    verifyToken: uuid("verify_token").notNull().unique().defaultRandom(),
    qrCodeUrl: text("qr_code_url"),
    pdfUrl: text("pdf_url"),
    isRevoked: boolean("is_revoked").notNull().default(false),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    revokeReason: text("revoke_reason"),
  },
  (table) => [
    unique("certificates_intern_id_task_group_id").on(
      table.internId,
      table.taskGroupId
    ),
    index("idx_certificates_intern").on(table.internId),
    index("idx_certificates_task_group").on(table.taskGroupId),
    index("idx_certificates_verify_token").on(table.verifyToken),
  ]
);

/* ================================================================== */
/* ADMIN ALLOWLIST  (manually managed — gates who may become admin)    */
/* ================================================================== */

export const adminAllowlist = pgTable("admin_allowlist", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: text("email").notNull().unique(),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .defaultNow(),
});

export type User = typeof users.$inferSelect;
export type Intern = typeof interns.$inferSelect;
export type Skill = typeof skills.$inferSelect;
export type CourseType = (typeof courseTypeEnum.enumValues)[number];
export type TaskGroup = typeof taskGroups.$inferSelect;
export type TaskSubgroup = typeof taskSubgroups.$inferSelect;
export type Task = typeof tasks.$inferSelect;
export type Application = typeof applications.$inferSelect;
export type InternTaskAssignment = typeof internTaskAssignments.$inferSelect;
export type TaskSubmission = typeof taskSubmissions.$inferSelect;
export type TaskFeedback = typeof taskFeedback.$inferSelect;
export type Certificate = typeof certificates.$inferSelect;
export type AdminAllowlistEntry = typeof adminAllowlist.$inferSelect;
export type ApplicationStatus = (typeof applicationStatusEnum.enumValues)[number];
export type TaskAssignmentStatus =
  (typeof taskAssignmentStatusEnum.enumValues)[number];
export type SubmissionReviewStatus =
  (typeof submissionReviewStatusEnum.enumValues)[number];
