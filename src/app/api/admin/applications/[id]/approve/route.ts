import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { approveApplication } from "@/lib/db/queries";

const postSchema = z.object({
  taskIds: z.array(z.string().uuid()).min(1, "Assign at least one task"),
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
    const result = await approveApplication(id, body.taskIds, session.adminUserId);
    return NextResponse.json({ ok: true, ...result });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    // A duplicate task assignment (task already claimed) violates the unique
    // constraint — surface it as a conflict rather than a 500.
    const message = error instanceof Error ? error.message : "Failed to approve";
    const isConflict = /unique|duplicate/i.test(message);
    console.error("Approve application error:", error);
    return NextResponse.json(
      { error: isConflict ? "One or more tasks are already assigned." : message },
      { status: isConflict ? 409 : 500 }
    );
  }
}
