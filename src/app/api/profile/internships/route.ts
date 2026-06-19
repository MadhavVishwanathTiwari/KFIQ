import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { internPastInternships } from "@/lib/db/schema";

const bodySchema = z.object({
  company: z.string().min(1),
  role: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  description: z.string().optional(),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const body = bodySchema.parse(await request.json());
    const [row] = await db
      .insert(internPastInternships)
      .values({
        internId: session.internId,
        company: body.company.trim(),
        role: body.role?.trim() || null,
        startDate: body.startDate || null,
        endDate: body.endDate || null,
        description: body.description?.trim() || null,
        source: "manual",
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Add internship error:", error);
    return NextResponse.json({ error: "Failed to add internship" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Internship id is required" }, { status: 400 });
  }

  await db
    .delete(internPastInternships)
    .where(
      sql`${internPastInternships.id} = ${id} AND ${internPastInternships.internId} = ${session.internId} AND ${internPastInternships.source} = 'manual'`
    );

  return NextResponse.json({ success: true });
}
