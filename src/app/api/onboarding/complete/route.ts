// src/app/api/onboarding/complete/route.ts
import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import {
  getInternById,
  markOnboardingComplete,
  toOnboardingIntern,
} from "@/lib/db/queries";

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const record = await getInternById(session.internId);
  if (!record) {
    return NextResponse.json({ error: "Intern not found" }, { status: 404 });
  }

  // A password is the only hard requirement to "finish" — resume/profile are
  // optional enrichments. Block completion only if no password is set.
  if (!record.user.passwordHash) {
    return NextResponse.json(
      { error: "Set a password before finishing onboarding." },
      { status: 400 }
    );
  }

  if (!record.intern.onboardingCompletedAt) {
    await markOnboardingComplete(record.intern.id);
  }

  const refreshed = await getInternById(session.internId);
  return NextResponse.json({
    intern: refreshed ? toOnboardingIntern(refreshed) : null,
  });
}
