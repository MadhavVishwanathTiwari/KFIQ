import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getTaskGroupDetail, updateTaskGroupCohort } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const { id } = await params;
  const detail = await getTaskGroupDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Task group not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}

const patchSchema = z.object({
  cohortId: z.string().uuid().nullable(),
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
    const group = await updateTaskGroupCohort(id, body.cohortId);
    if (!group) {
      return NextResponse.json({ error: "Task group not found" }, { status: 404 });
    }
    return NextResponse.json({ taskGroup: group });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Task group PATCH error:", error);
    return NextResponse.json({ error: "Failed to update task group" }, { status: 500 });
  }
}
