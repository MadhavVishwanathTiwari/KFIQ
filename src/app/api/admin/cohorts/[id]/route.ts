import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { deleteCohort, updateCohort } from "@/lib/db/queries";

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .nullable();

const patchSchema = z.object({
  name: z.string().trim().min(1).optional(),
  description: z.string().trim().optional().nullable(),
  startsAt: dateString,
  endsAt: dateString,
  isActive: z.boolean().optional(),
});

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  const { id } = await params;
  try {
    const body = patchSchema.parse(await request.json());
    const cohort = await updateCohort(id, body);
    if (!cohort) {
      return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
    }
    return NextResponse.json({ cohort });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Cohort PATCH error:", error);
    return NextResponse.json({ error: "Failed to update cohort" }, { status: 500 });
  }
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  const { id } = await params;
  const removed = await deleteCohort(id);
  if (!removed) {
    return NextResponse.json({ error: "Cohort not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}
