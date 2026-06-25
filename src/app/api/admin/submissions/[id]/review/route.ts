import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { isCertificateEligible, reviewSubmission } from "@/lib/db/queries";

const postSchema = z.object({
  decision: z.enum(["approved", "rejected"]),
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
    const { internId, taskGroupId } = await reviewSubmission(
      id,
      body.decision,
      session.adminUserId
    );

    // After an approval, tell the UI whether the intern is now cert-eligible
    // so it can surface the "Issue certificate" action.
    const certificateEligible =
      body.decision === "approved"
        ? await isCertificateEligible(internId, taskGroupId)
        : false;

    return NextResponse.json({
      ok: true,
      internId,
      taskGroupId,
      certificateEligible,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Review submission error:", error);
    return NextResponse.json({ error: "Failed to review submission" }, { status: 500 });
  }
}
