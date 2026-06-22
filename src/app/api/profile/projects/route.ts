import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { internProjects } from "@/lib/db/schema";

const bodySchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  techStack: z.array(z.string()).optional(),
  projectUrl: z.string().url().optional().or(z.literal("")),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const body = bodySchema.parse(await request.json());
    const [row] = await db
      .insert(internProjects)
      .values({
        internId: session.internId,
        title: body.title.trim(),
        description: body.description?.trim() || null,
        techStack: body.techStack?.length ? body.techStack : null,
        projectUrl: body.projectUrl?.trim() || null,
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        source: "manual",
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Add project error:", error);
    return NextResponse.json({ error: "Failed to add project" }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Project id is required" }, { status: 400 });
  }

  try {
    const body = bodySchema.parse(await request.json());
    const [row] = await db
      .update(internProjects)
      .set({
        title: body.title.trim(),
        description: body.description?.trim() || null,
        techStack: body.techStack?.length ? body.techStack : null,
        projectUrl: body.projectUrl?.trim() || null,
        // startDate/endDate are not editable in the form; leave them untouched.
        source: "manual",
      })
      .where(
        sql`${internProjects.id} = ${id} AND ${internProjects.internId} = ${session.internId}`
      )
      .returning();

    if (!row) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 });
    }

    return NextResponse.json(row);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Update project error:", error);
    return NextResponse.json({ error: "Failed to update project" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Project id is required" }, { status: 400 });
  }

  await db
    .delete(internProjects)
    .where(
      sql`${internProjects.id} = ${id} AND ${internProjects.internId} = ${session.internId}`
    );

  return NextResponse.json({ success: true });
}
