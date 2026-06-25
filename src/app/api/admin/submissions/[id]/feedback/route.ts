import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { addFeedback } from "@/lib/db/queries";

const postSchema = z.object({
  feedbackText: z.string().trim().min(1, "Feedback cannot be empty"),
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
    const feedback = await addFeedback(id, session.adminUserId, body.feedbackText);
    return NextResponse.json({ feedback }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Feedback POST error:", error);
    return NextResponse.json({ error: "Failed to add feedback" }, { status: 500 });
  }
}
