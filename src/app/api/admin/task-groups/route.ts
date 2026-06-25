import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createTaskGroup, listTaskGroups } from "@/lib/db/queries";

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  return NextResponse.json({ taskGroups: await listTaskGroups() });
}

const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  field: z.string().trim().min(1, "Field is required"),
  cohortId: z.string().uuid().optional().nullable(),
  skillIds: z.array(z.string().uuid()).optional(),
});

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  try {
    const body = postSchema.parse(await request.json());
    const group = await createTaskGroup({
      title: body.title,
      description: body.description ?? null,
      field: body.field,
      cohortId: body.cohortId ?? null,
      skillIds: body.skillIds ?? [],
      createdBy: session.adminUserId,
    });
    return NextResponse.json({ taskGroup: group }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Task group POST error:", error);
    return NextResponse.json({ error: "Failed to create task group" }, { status: 500 });
  }
}
