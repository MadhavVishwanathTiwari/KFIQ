import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { issueCertificate, listCertificates } from "@/lib/db/queries";

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  return NextResponse.json({ certificates: await listCertificates() });
}

const postSchema = z.object({
  internId: z.string().uuid(),
  taskGroupId: z.string().uuid(),
});

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  try {
    const body = postSchema.parse(await request.json());
    const cert = await issueCertificate(
      body.internId,
      body.taskGroupId,
      session.adminUserId
    );
    if (!cert) {
      return NextResponse.json(
        { error: "Intern is not eligible — not all assigned tasks are approved." },
        { status: 409 }
      );
    }
    // NOTE: markupgo PDF/QR generation is intentionally deferred. We only create
    // the certificate row + verify_token here.
    return NextResponse.json({ certificate: cert }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Issue certificate error:", error);
    return NextResponse.json({ error: "Failed to issue certificate" }, { status: 500 });
  }
}
