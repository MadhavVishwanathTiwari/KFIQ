import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { internEducation } from "@/lib/db/schema";

const bodySchema = z.object({
  institution: z.string().min(1),
  degree: z.string().optional(),
  fieldOfStudy: z.string().optional(),
  startYear: z.coerce.number().int().min(1950).max(2100).optional(),
  endYear: z.coerce.number().int().min(1950).max(2100).optional(),
  grade: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const body = bodySchema.parse(await request.json());
    const [row] = await db
      .insert(internEducation)
      .values({
        internId: session.internId,
        institution: body.institution.trim(),
        degree: body.degree?.trim() || null,
        fieldOfStudy: body.fieldOfStudy?.trim() || null,
        startYear: body.startYear ?? null,
        endYear: body.endYear ?? null,
        grade: body.grade?.trim() || null,
        source: "manual",
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Add education error:", error);
    return NextResponse.json({ error: "Failed to add education" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Education id is required" }, { status: 400 });
  }

  await db
    .delete(internEducation)
    .where(
      sql`${internEducation.id} = ${id} AND ${internEducation.internId} = ${session.internId} AND ${internEducation.source} = 'manual'`
    );

  return NextResponse.json({ success: true });
}
