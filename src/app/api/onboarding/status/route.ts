import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { getInternById, getInternProfile } from "@/lib/db/queries";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const record = await getInternById(session.internId);
  if (!record) {
    return NextResponse.json({ error: "Intern not found" }, { status: 404 });
  }

  const profile = await getInternProfile(session.internId);

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
      resumeParsedAt: record.intern.resumeParsedAt,
      hasPassword: Boolean(record.user.passwordHash),
      onboardingCompletedAt: record.intern.onboardingCompletedAt
        ? record.intern.onboardingCompletedAt.toISOString()
        : null,
    },
    profile,
  });
}
