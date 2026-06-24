import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  campusAmbassadors,
  cohorts,
  internCertifications,
  internEducation,
  internPastInternships,
  internProjects,
  internSkills,
  interns,
  skills,
  users,
} from "@/lib/db/schema";

import type { CourseType, Intern, User } from "./schema";

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
