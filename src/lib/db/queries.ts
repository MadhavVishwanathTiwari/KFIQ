import { and, desc, eq, isNull, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  adminAllowlist,
  applications,
  campusAmbassadors,
  certificates,
  cohorts,
  internCertifications,
  internEducation,
  internPastInternships,
  internProjects,
  internSkills,
  internTaskAssignments,
  interns,
  skills,
  taskFeedback,
  taskGroups,
  taskGroupSkills,
  taskSubgroups,
  taskSubmissions,
  tasks,
  users,
} from "@/lib/db/schema";

import type {
  ApplicationStatus,
  CourseType,
  Intern,
  User,
} from "./schema";

export function toOnboardingIntern(record: { intern: Intern; user: User }) {
  return {
    id: record.intern.id,
    fullName: record.intern.fullName,
    college: record.intern.college,
    courseType: record.intern.courseType,
    fieldOfInterest: record.intern.fieldOfInterest,
    goal: record.intern.goal,
    resumeParseStatus: record.intern.resumeParseStatus,
    resumeUrl: record.intern.resumeUrl,
    hasPassword: Boolean(record.user.passwordHash),
    onboardingCompletedAt: record.intern.onboardingCompletedAt
      ? record.intern.onboardingCompletedAt.toISOString()
      : null,
  };
}
export async function getInternByEmail(email: string) {
  const rows = await db
    .select({
      intern: interns,
      user: users,
    })
    .from(users)
    .innerJoin(interns, eq(interns.userId, users.id))
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);

  return rows[0] ?? null;
}

export async function getInternById(internId: string) {
  const rows = await db
    .select({
      intern: interns,
      user: users,
    })
    .from(interns)
    .innerJoin(users, eq(users.id, interns.userId))
    .where(eq(interns.id, internId))
    .limit(1);

  return rows[0] ?? null;
}

export async function getInternProfile(internId: string) {
  const [skillRows, certRows, eduRows, internshipRows, projectRows] =
    await Promise.all([
      db
        .select({
          id: internSkills.id,
          source: internSkills.source,
          skillId: skills.id,
          name: skills.name,
          category: skills.category,
        })
        .from(internSkills)
        .innerJoin(skills, eq(skills.id, internSkills.skillId))
        .where(eq(internSkills.internId, internId)),
      db
        .select()
        .from(internCertifications)
        .where(eq(internCertifications.internId, internId)),
      db
        .select()
        .from(internEducation)
        .where(eq(internEducation.internId, internId)),
      db
        .select()
        .from(internPastInternships)
        .where(eq(internPastInternships.internId, internId)),
      db
        .select()
        .from(internProjects)
        .where(eq(internProjects.internId, internId)),
    ]);

  return {
    skills: skillRows,
    certifications: certRows,
    education: eduRows,
    pastInternships: internshipRows,
    projects: projectRows,
  };
}

export async function setUserPassword(userId: string, passwordHash: string) {
  await db
    .update(users)
    .set({ passwordHash, updatedAt: new Date() })
    .where(eq(users.id, userId));
}

export async function getAmbassadorByReferralCode(referralCode: string) {
  const rows = await db
    .select()
    .from(campusAmbassadors)
    .where(eq(campusAmbassadors.referralCode, referralCode.trim().toUpperCase()))
    .limit(1);

  return rows[0] ?? null;
}

async function getActiveCohortId(): Promise<string | null> {
  const rows = await db
    .select({ id: cohorts.id })
    .from(cohorts)
    .where(eq(cohorts.isActive, true))
    .limit(1);

  return rows[0]?.id ?? null;
}

/** Lists cohorts for the admin task-group form (active ones first). */
export async function listCohorts() {
  return db
    .select({
      id: cohorts.id,
      name: cohorts.name,
      isActive: cohorts.isActive,
    })
    .from(cohorts)
    .orderBy(desc(cohorts.isActive), desc(cohorts.createdAt));
}

export type NewInternInput = {
  email: string;
  fullName: string;
  college: string;
  courseType: CourseType;
  fieldOfInterest: string;
  goal: string;
  referredBy?: string | null;
};

/**
 * Creates a brand-new intern (user + intern rows) for in-app signup. The user
 * is created without a password — the password is set later in onboarding's
 * first step. Returns the same shape as getInternByEmail.
 */
export async function createIntern(input: NewInternInput) {
  const email = input.email.toLowerCase();
  const cohortId = await getActiveCohortId();

  return db.transaction(async (tx) => {
    const [user] = await tx
      .insert(users)
      .values({ email, role: "intern" })
      .returning();

    const [intern] = await tx
      .insert(interns)
      .values({
        userId: user.id,
        fullName: input.fullName,
        college: input.college,
        courseType: input.courseType,
        fieldOfInterest: input.fieldOfInterest,
        goal: input.goal,
        cohortId,
        referredBy: input.referredBy ?? null,
      })
      .returning();

    return { intern, user };
  });
}

export async function markOnboardingComplete(internId: string) {
  await db
    .update(interns)
    .set({ onboardingCompletedAt: new Date(), updatedAt: new Date() })
    .where(eq(interns.id, internId));
}

/* ================================================================== */
/* ADMIN — AUTH / ALLOWLIST                                            */
/* ================================================================== */

/** True if the email is on the manually-managed admin allowlist. */
export async function isEmailAllowlistedAdmin(email: string): Promise<boolean> {
  const rows = await db
    .select({ id: adminAllowlist.id })
    .from(adminAllowlist)
    .where(eq(adminAllowlist.email, email.toLowerCase()))
    .limit(1);
  return rows.length > 0;
}

/** Looks up an existing admin user by email (role must be 'admin'). */
export async function getAdminUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(and(eq(users.email, email.toLowerCase()), eq(users.role, "admin")))
    .limit(1);
  return rows[0] ?? null;
}

/** Looks up any user by email regardless of role (used to detect collisions). */
export async function getUserByEmail(email: string) {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email.toLowerCase()))
    .limit(1);
  return rows[0] ?? null;
}

/** Creates a new admin user with a password. Caller must gate via allowlist. */
export async function createAdminUser(email: string, passwordHash: string) {
  const [user] = await db
    .insert(users)
    .values({ email: email.toLowerCase(), passwordHash, role: "admin" })
    .returning();
  return user;
}

/* ================================================================== */
/* ADMIN — SKILLS                                                      */
/* ================================================================== */

export async function listSkills() {
  return db.select().from(skills).orderBy(skills.name);
}

/**
 * Resolves a list of skill names to skill ids, creating any that don't exist
 * yet (case-insensitive — the `skills.name` column is CITEXT-unique).
 */
export async function getOrCreateSkills(names: string[]): Promise<string[]> {
  const cleaned = Array.from(
    new Set(names.map((n) => n.trim()).filter(Boolean))
  );
  if (cleaned.length === 0) return [];

  return db.transaction(async (tx) => {
    const ids: string[] = [];
    for (const name of cleaned) {
      const [row] = await tx
        .insert(skills)
        .values({ name })
        .onConflictDoNothing({ target: skills.name })
        .returning({ id: skills.id });

      if (row) {
        ids.push(row.id);
      } else {
        const [existing] = await tx
          .select({ id: skills.id })
          .from(skills)
          .where(eq(skills.name, name))
          .limit(1);
        if (existing) ids.push(existing.id);
      }
    }
    return ids;
  });
}

/* ================================================================== */
/* ADMIN — TASK GROUPS / SUBGROUPS / TASKS                             */
/* ================================================================== */

export type NewTaskGroupInput = {
  title: string;
  description?: string | null;
  field: string;
  cohortId?: string | null;
  skillIds: string[];
  createdBy: string;
};

export async function createTaskGroup(input: NewTaskGroupInput) {
  return db.transaction(async (tx) => {
    const [group] = await tx
      .insert(taskGroups)
      .values({
        title: input.title,
        description: input.description ?? null,
        field: input.field,
        cohortId: input.cohortId ?? null,
        createdBy: input.createdBy,
      })
      .returning();

    if (input.skillIds.length > 0) {
      await tx
        .insert(taskGroupSkills)
        .values(
          input.skillIds.map((skillId) => ({
            taskGroupId: group.id,
            skillId,
          }))
        )
        .onConflictDoNothing();
    }

    return group;
  });
}

export async function listTaskGroups() {
  const groups = await db
    .select()
    .from(taskGroups)
    .orderBy(desc(taskGroups.createdAt));

  // Attach a quick task count per group (direct + subgroup tasks).
  const counts = await db
    .select({
      taskGroupId: sql<string>`coalesce(${tasks.taskGroupId}, ${taskSubgroups.taskGroupId})`.as(
        "tg_id"
      ),
      count: sql<number>`count(*)::int`,
    })
    .from(tasks)
    .leftJoin(taskSubgroups, eq(tasks.taskSubgroupId, taskSubgroups.id))
    .groupBy(sql`coalesce(${tasks.taskGroupId}, ${taskSubgroups.taskGroupId})`);

  const countMap = new Map(counts.map((c) => [c.taskGroupId, c.count]));
  return groups.map((g) => ({ ...g, taskCount: countMap.get(g.id) ?? 0 }));
}

/** Full detail of a group: its skills, subgroups, and tasks (direct + nested). */
export async function getTaskGroupDetail(groupId: string) {
  const [group] = await db
    .select()
    .from(taskGroups)
    .where(eq(taskGroups.id, groupId))
    .limit(1);
  if (!group) return null;

  const [groupSkillRows, subgroupRows, taskRows] = await Promise.all([
    db
      .select({ id: skills.id, name: skills.name })
      .from(taskGroupSkills)
      .innerJoin(skills, eq(skills.id, taskGroupSkills.skillId))
      .where(eq(taskGroupSkills.taskGroupId, groupId)),
    db
      .select()
      .from(taskSubgroups)
      .where(eq(taskSubgroups.taskGroupId, groupId))
      .orderBy(taskSubgroups.sequenceOrder),
    db
      .select()
      .from(tasks)
      .where(
        sql`${tasks.taskGroupId} = ${groupId} OR ${tasks.taskSubgroupId} IN (
          SELECT id FROM task_subgroups WHERE task_group_id = ${groupId}
        )`
      )
      .orderBy(tasks.sequenceOrder),
  ]);

  const directTasks = taskRows.filter((t) => t.taskGroupId === groupId);
  const subgroups = subgroupRows.map((sg) => ({
    ...sg,
    tasks: taskRows.filter((t) => t.taskSubgroupId === sg.id),
  }));

  return { group, skills: groupSkillRows, subgroups, directTasks };
}

export type NewSubgroupInput = {
  taskGroupId: string;
  title: string;
  description?: string | null;
  sequenceOrder?: number;
  canRunConcurrent?: boolean;
};

export async function createSubgroup(input: NewSubgroupInput) {
  const [subgroup] = await db
    .insert(taskSubgroups)
    .values({
      taskGroupId: input.taskGroupId,
      title: input.title,
      description: input.description ?? null,
      sequenceOrder: input.sequenceOrder ?? 1,
      canRunConcurrent: input.canRunConcurrent ?? false,
    })
    .returning();
  return subgroup;
}

export type NewTaskInput = {
  taskGroupId?: string | null;
  taskSubgroupId?: string | null;
  title: string;
  description?: string | null;
  field?: string | null;
  requiredSkills?: string[];
  sequenceOrder?: number;
  canRunConcurrent?: boolean;
  createdBy: string;
};

export async function createTask(input: NewTaskInput) {
  const hasGroup = Boolean(input.taskGroupId);
  const hasSubgroup = Boolean(input.taskSubgroupId);
  // Mirror the DB CHECK so we fail with a clear message before hitting Postgres.
  if (hasGroup === hasSubgroup) {
    throw new Error(
      "A task must belong to exactly one parent: a task group OR a subgroup."
    );
  }

  const [task] = await db
    .insert(tasks)
    .values({
      taskGroupId: input.taskGroupId ?? null,
      taskSubgroupId: input.taskSubgroupId ?? null,
      title: input.title,
      description: input.description ?? null,
      field: input.field ?? null,
      requiredSkills: input.requiredSkills ?? [],
      sequenceOrder: input.sequenceOrder ?? 1,
      canRunConcurrent: input.canRunConcurrent ?? false,
      createdBy: input.createdBy,
    })
    .returning();
  return task;
}

/* ================================================================== */
/* ADMIN — APPLICATIONS                                               */
/* ================================================================== */

/** Lists applications (optionally by status) joined to intern + group info. */
export async function listApplications(status?: ApplicationStatus) {
  return db
    .select({
      id: applications.id,
      status: applications.status,
      appliedAt: applications.appliedAt,
      rejectionNote: applications.rejectionNote,
      internId: interns.id,
      internName: interns.fullName,
      internCollege: interns.college,
      taskGroupId: taskGroups.id,
      taskGroupTitle: taskGroups.title,
      taskGroupField: taskGroups.field,
    })
    .from(applications)
    .innerJoin(interns, eq(interns.id, applications.internId))
    .innerJoin(taskGroups, eq(taskGroups.id, applications.taskGroupId))
    .where(status ? eq(applications.status, status) : undefined)
    .orderBy(desc(applications.appliedAt));
}

/** Tasks in a group that are not yet assigned to anyone (assignable on approve). */
export async function listAssignableTasks(taskGroupId: string) {
  return db
    .select({
      id: tasks.id,
      title: tasks.title,
      taskSubgroupId: tasks.taskSubgroupId,
      sequenceOrder: tasks.sequenceOrder,
    })
    .from(tasks)
    .leftJoin(taskSubgroups, eq(tasks.taskSubgroupId, taskSubgroups.id))
    .leftJoin(
      internTaskAssignments,
      eq(internTaskAssignments.taskId, tasks.id)
    )
    .where(
      and(
        sql`(${tasks.taskGroupId} = ${taskGroupId} OR ${taskSubgroups.taskGroupId} = ${taskGroupId})`,
        isNull(internTaskAssignments.id)
      )
    )
    .orderBy(tasks.sequenceOrder);
}

/**
 * Approves an application and assigns the chosen tasks in one transaction.
 * Assignment happens AT approval — one intern_task_assignment per task id.
 */
export async function approveApplication(
  applicationId: string,
  taskIds: string[],
  adminUserId: string
) {
  return db.transaction(async (tx) => {
    const [application] = await tx
      .select()
      .from(applications)
      .where(eq(applications.id, applicationId))
      .limit(1);
    if (!application) throw new Error("Application not found");

    await tx
      .update(applications)
      .set({
        status: "approved",
        reviewedAt: new Date(),
        reviewedBy: adminUserId,
        rejectionNote: null,
      })
      .where(eq(applications.id, applicationId));

    if (taskIds.length > 0) {
      await tx.insert(internTaskAssignments).values(
        taskIds.map((taskId) => ({
          applicationId,
          internId: application.internId,
          taskId,
          assignedBy: adminUserId,
        }))
      );
    }

    return { assignedCount: taskIds.length };
  });
}

export async function rejectApplication(
  applicationId: string,
  note: string | null,
  adminUserId: string
) {
  await db
    .update(applications)
    .set({
      status: "rejected",
      reviewedAt: new Date(),
      reviewedBy: adminUserId,
      rejectionNote: note,
    })
    .where(eq(applications.id, applicationId));
}

/* ================================================================== */
/* ADMIN — SUBMISSIONS / REVIEW / FEEDBACK                            */
/* ================================================================== */

/** Submissions awaiting review, with intern + task + group context. */
export async function listSubmissionsForReview() {
  return db
    .select({
      id: taskSubmissions.id,
      notes: taskSubmissions.notes,
      attachmentUrls: taskSubmissions.attachmentUrls,
      submittedAt: taskSubmissions.submittedAt,
      reviewStatus: taskSubmissions.reviewStatus,
      assignmentId: internTaskAssignments.id,
      internId: interns.id,
      internName: interns.fullName,
      taskId: tasks.id,
      taskTitle: tasks.title,
      taskGroupId: taskGroups.id,
      taskGroupTitle: taskGroups.title,
    })
    .from(taskSubmissions)
    .innerJoin(
      internTaskAssignments,
      eq(internTaskAssignments.id, taskSubmissions.assignmentId)
    )
    .innerJoin(interns, eq(interns.id, taskSubmissions.internId))
    .innerJoin(tasks, eq(tasks.id, internTaskAssignments.taskId))
    .innerJoin(applications, eq(applications.id, internTaskAssignments.applicationId))
    .innerJoin(taskGroups, eq(taskGroups.id, applications.taskGroupId))
    .orderBy(desc(taskSubmissions.submittedAt));
}

/**
 * Reviews a submission: sets the submission review_status AND the linked
 * assignment status. Returns the intern + group so the caller can check
 * certificate eligibility. 'approved' submission → assignment 'approved';
 * 'rejected' → assignment 'rejected' (intern can resubmit).
 */
export async function reviewSubmission(
  submissionId: string,
  decision: "approved" | "rejected",
  adminUserId: string
) {
  return db.transaction(async (tx) => {
    const [submission] = await tx
      .select()
      .from(taskSubmissions)
      .where(eq(taskSubmissions.id, submissionId))
      .limit(1);
    if (!submission) throw new Error("Submission not found");

    await tx
      .update(taskSubmissions)
      .set({
        reviewStatus: decision,
        reviewedBy: adminUserId,
        reviewedAt: new Date(),
      })
      .where(eq(taskSubmissions.id, submissionId));

    await tx
      .update(internTaskAssignments)
      .set({ status: decision, updatedAt: new Date() })
      .where(eq(internTaskAssignments.id, submission.assignmentId));

    const [assignment] = await tx
      .select({
        internId: internTaskAssignments.internId,
        applicationId: internTaskAssignments.applicationId,
      })
      .from(internTaskAssignments)
      .where(eq(internTaskAssignments.id, submission.assignmentId))
      .limit(1);

    const [application] = await tx
      .select({ taskGroupId: applications.taskGroupId })
      .from(applications)
      .where(eq(applications.id, assignment.applicationId))
      .limit(1);

    return {
      internId: assignment.internId,
      taskGroupId: application.taskGroupId,
    };
  });
}

export async function addFeedback(
  submissionId: string,
  adminUserId: string,
  feedbackText: string
) {
  const [row] = await db
    .insert(taskFeedback)
    .values({ submissionId, givenBy: adminUserId, feedbackText })
    .returning();
  return row;
}

/* ================================================================== */
/* ADMIN — CERTIFICATES                                               */
/* ================================================================== */

/**
 * Counts an intern's assignments within a group: total vs approved. Replaces
 * the SQL intern_group_progress view so we don't depend on DB views.
 */
export async function getGroupProgressForIntern(
  internId: string,
  taskGroupId: string
) {
  const [row] = await db
    .select({
      total: sql<number>`count(*)::int`,
      approved: sql<number>`count(*) FILTER (WHERE ${internTaskAssignments.status} = 'approved')::int`,
    })
    .from(internTaskAssignments)
    .innerJoin(
      applications,
      eq(applications.id, internTaskAssignments.applicationId)
    )
    .where(
      and(
        eq(internTaskAssignments.internId, internId),
        eq(applications.taskGroupId, taskGroupId)
      )
    );

  const total = row?.total ?? 0;
  const approved = row?.approved ?? 0;
  return { total, approved, complete: total > 0 && total === approved };
}

/** Whether the intern has every assigned task approved and no cert issued yet. */
export async function isCertificateEligible(
  internId: string,
  taskGroupId: string
) {
  const progress = await getGroupProgressForIntern(internId, taskGroupId);
  if (!progress.complete) return false;

  const existing = await db
    .select({ id: certificates.id })
    .from(certificates)
    .where(
      and(
        eq(certificates.internId, internId),
        eq(certificates.taskGroupId, taskGroupId)
      )
    )
    .limit(1);

  return existing.length === 0;
}

/**
 * Issues a certificate row (no PDF/QR — markupgo wiring is deferred). Idempotent
 * via the (intern_id, task_group_id) unique constraint. Returns null if the
 * intern is not actually eligible.
 */
export async function issueCertificate(
  internId: string,
  taskGroupId: string,
  adminUserId: string
) {
  const progress = await getGroupProgressForIntern(internId, taskGroupId);
  if (!progress.complete) return null;

  const [cert] = await db
    .insert(certificates)
    .values({ internId, taskGroupId, issuedBy: adminUserId })
    .onConflictDoNothing({
      target: [certificates.internId, certificates.taskGroupId],
    })
    .returning();

  // onConflictDoNothing returns nothing if it already existed — fetch it.
  if (cert) return cert;
  const [existing] = await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.internId, internId),
        eq(certificates.taskGroupId, taskGroupId)
      )
    )
    .limit(1);
  return existing ?? null;
}

export async function listCertificates() {
  return db
    .select({
      id: certificates.id,
      issuedAt: certificates.issuedAt,
      verifyToken: certificates.verifyToken,
      internName: interns.fullName,
      taskGroupTitle: taskGroups.title,
    })
    .from(certificates)
    .innerJoin(interns, eq(interns.id, certificates.internId))
    .innerJoin(taskGroups, eq(taskGroups.id, certificates.taskGroupId))
    .orderBy(desc(certificates.issuedAt));
}
