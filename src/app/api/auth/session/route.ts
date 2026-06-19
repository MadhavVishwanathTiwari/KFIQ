import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { getInternByEmail } from "@/lib/db/queries";

const bodySchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const record = await getInternByEmail(body.email);

    if (!record) {
      return NextResponse.json(
        { error: "No intern account found for this email. Sign up on the landing page first." },
        { status: 404 }
      );
    }

    if (!record.user.isActive) {
      return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
    }

    await setSessionCookie({
      internId: record.intern.id,
      userId: record.user.id,
      email: record.user.email,
    });

    return NextResponse.json({
      intern: {
        id: record.intern.id,
        fullName: record.intern.fullName,
        college: record.intern.college,
        courseType: record.intern.courseType,
        fieldOfInterest: record.intern.fieldOfInterest,
        goal: record.intern.goal,
        resumeParseStatus: record.intern.resumeParseStatus,
        resumeUrl: record.intern.resumeUrl,
        hasPassword: Boolean(record.user.passwordHash),
      },
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Session start error:", error);
    return NextResponse.json({ error: "Failed to start session" }, { status: 500 });
  }
}
