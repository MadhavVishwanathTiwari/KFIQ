import { NextRequest, NextResponse } from "next/server";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { internSkills, skills } from "@/lib/db/schema";

const bodySchema = z.object({
  name: z.string().min(1),
  category: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const body = bodySchema.parse(await request.json());
    const trimmed = body.name.trim();

    const existing = await db
      .select({ id: skills.id })
      .from(skills)
      .where(sql`${skills.name} = ${trimmed}`)
      .limit(1);

    let skillId = existing[0]?.id;

    if (!skillId) {
      const [created] = await db
        .insert(skills)
        .values({ name: trimmed, category: body.category ?? null })
        .onConflictDoNothing({ target: skills.name })
        .returning({ id: skills.id });

      skillId =
        created?.id ??
        (
          await db
            .select({ id: skills.id })
            .from(skills)
            .where(sql`${skills.name} = ${trimmed}`)
            .limit(1)
        )[0]?.id;
    }

    if (!skillId) {
      return NextResponse.json({ error: "Failed to save skill" }, { status: 500 });
    }

    const [row] = await db
      .insert(internSkills)
      .values({
        internId: session.internId,
        skillId,
        source: "manual",
      })
      .onConflictDoNothing()
      .returning();

    if (!row) {
      return NextResponse.json(
        { error: "Skill already added to your profile" },
        { status: 409 }
      );
    }

    return NextResponse.json({
      id: row.id,
      skillId,
      name: trimmed,
      source: "manual",
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Add skill error:", error);
    return NextResponse.json({ error: "Failed to add skill" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Skill id is required" }, { status: 400 });
  }

  await db
    .delete(internSkills)
    .where(
      sql`${internSkills.id} = ${id} AND ${internSkills.internId} = ${session.internId} AND ${internSkills.source} = 'manual'`
    );

  return NextResponse.json({ success: true });
}
