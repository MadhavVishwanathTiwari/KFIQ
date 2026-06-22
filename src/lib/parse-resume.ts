import { and, eq, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  internCertifications,
  internEducation,
  internPastInternships,
  internProjects,
  internSkills,
  interns,
  skills,
} from "@/lib/db/schema";
import type { ParsedResumeData } from "@/lib/resume-parser-types";

function yearFromDate(value?: string | null): number | null {
  if (!value) return null;
  const year = Number(value.slice(0, 4));
  return Number.isFinite(year) ? year : null;
}

function dateOnly(value?: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

type DbClient = Pick<typeof db, "select" | "insert">;

async function findOrCreateSkillId(
  tx: DbClient,
  name: string
): Promise<string> {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error("Skill name cannot be empty");
  }

  const existing = await tx
    .select({ id: skills.id })
    .from(skills)
    .where(sql`${skills.name} = ${trimmed}`)
    .limit(1);

  if (existing[0]) {
    return existing[0].id;
  }

  const [created] = await tx
    .insert(skills)
    .values({ name: trimmed })
    .onConflictDoNothing({ target: skills.name })
    .returning({ id: skills.id });

  if (created) {
    return created.id;
  }

  const fallback = await tx
    .select({ id: skills.id })
    .from(skills)
    .where(sql`${skills.name} = ${trimmed}`)
    .limit(1);

  if (!fallback[0]) {
    throw new Error(`Failed to resolve skill: ${trimmed}`);
  }

  return fallback[0].id;
}

export async function clearResumeSourcedProfile(internId: string) {
  await db.transaction(async (tx) => {
    await tx
      .delete(internSkills)
      .where(
        and(eq(internSkills.internId, internId), eq(internSkills.source, "resume"))
      );
    await tx
      .delete(internCertifications)
      .where(
        and(
          eq(internCertifications.internId, internId),
          eq(internCertifications.source, "resume")
        )
      );
    await tx
      .delete(internEducation)
      .where(
        and(
          eq(internEducation.internId, internId),
          eq(internEducation.source, "resume")
        )
      );
    await tx
      .delete(internPastInternships)
      .where(
        and(
          eq(internPastInternships.internId, internId),
          eq(internPastInternships.source, "resume")
        )
      );
    await tx
      .delete(internProjects)
      .where(
        and(
          eq(internProjects.internId, internId),
          eq(internProjects.source, "resume")
        )
      );
  });
}

export async function persistParsedResumeData(
  internId: string,
  data: ParsedResumeData
) {
  await db.transaction(async (tx) => {
    for (const skill of data.skills ?? []) {
      if (!skill.name?.trim()) continue;
      const skillId = await findOrCreateSkillId(tx, skill.name);
      await tx
        .insert(internSkills)
        .values({
          internId,
          skillId,
          source: "resume",
        })
        .onConflictDoNothing();
    }

    for (const cert of data.certifications ?? []) {
      if (!cert.trim()) continue;
      await tx.insert(internCertifications).values({
        internId,
        name: cert.trim(),
        source: "resume",
      });
    }

    for (const edu of data.education ?? []) {
      if (!edu.organization?.trim()) continue;
      await tx.insert(internEducation).values({
        internId,
        institution: edu.organization.trim(),
        degree: edu.degree?.trim() || null,
        fieldOfStudy: edu.fieldOfStudy?.trim() || null,
        startYear: yearFromDate(edu.startDate),
        endYear: yearFromDate(edu.endDate),
        grade: edu.grade?.trim() || null,
        source: "resume",
      });
    }

    // SharpAPI returns all work history as `positions`. For an intern-focused
    // product these map to Past Internships. Projects are manual-only because
    // SharpAPI's parse_resume response has no projects field.
    for (const exp of data.workExperience ?? []) {
      if (!exp.organization?.trim()) continue;

      await tx.insert(internPastInternships).values({
        internId,
        company: exp.organization.trim(),
        role: exp.jobTitle?.trim() || null,
        startDate: dateOnly(exp.startDate),
        endDate: dateOnly(exp.endDate),
        description: exp.jobDescription?.trim() || null,
        source: "resume",
      });
    }
  });
}

export async function markResumeParsing(
  internId: string,
  status: "processing" | "done" | "failed"
) {
  await db
    .update(interns)
    .set({
      resumeParseStatus: status,
      resumeParsedAt: status === "done" || status === "failed" ? new Date() : null,
      updatedAt: new Date(),
    })
    .where(eq(interns.id, internId));
}

export async function setResumePending(internId: string, resumeUrl: string) {
  await db
    .update(interns)
    .set({
      resumeUrl,
      resumeParseStatus: "pending",
      resumeParsedAt: null,
      updatedAt: new Date(),
    })
    .where(eq(interns.id, internId));
}
