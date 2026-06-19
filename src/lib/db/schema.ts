import {
  boolean,
  date,
  index,
  pgEnum,
  pgTable,
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

export type User = typeof users.$inferSelect;
export type Intern = typeof interns.$inferSelect;
export type Skill = typeof skills.$inferSelect;
