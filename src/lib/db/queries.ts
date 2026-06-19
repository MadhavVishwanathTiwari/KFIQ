import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  internCertifications,
  internEducation,
  internPastInternships,
  internProjects,
  internSkills,
  interns,
  skills,
  users,
} from "@/lib/db/schema";

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
