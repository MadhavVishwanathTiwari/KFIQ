import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createTask } from "@/lib/db/queries";

// A task is attached either directly to the group or to one of its subgroups.
// If `subgroupId` is provided the task goes under the subgroup, else under the
// group directly (the DB CHECK enforces exactly-one parent).
const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  field: z.string().trim().optional(),
  subgroupId: z.string().uuid().optional().nullable(),
  requiredSkills: z.array(z.string().uuid()).optional(),
  sequenceOrder: z.number().int().min(1).optional(),
  canRunConcurrent: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const { id } = await params;
  try {
    const body = postSchema.parse(await request.json());
    const underSubgroup = Boolean(body.subgroupId);
    const task = await createTask({
      taskGroupId: underSubgroup ? null : id,
      taskSubgroupId: body.subgroupId ?? null,
      title: body.title,
      description: body.description ?? null,
      field: body.field ?? null,
      requiredSkills: body.requiredSkills ?? [],
      sequenceOrder: body.sequenceOrder,
      canRunConcurrent: body.canRunConcurrent,
      createdBy: session.adminUserId,
    });
    return NextResponse.json({ task }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Task POST error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
