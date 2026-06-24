// src/app/api/auth/signup/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { courseTypeEnum } from "@/lib/db/schema";
import {
  createIntern,
  getAmbassadorByReferralCode,
  getInternByEmail,
  toOnboardingIntern,
} from "@/lib/db/queries";

const bodySchema = z.object({
  email: z.string().email(),
  fullName: z.string().trim().min(1, "Full name is required"),
  college: z.string().trim().min(1, "College is required"),
  courseType: z.enum(courseTypeEnum.enumValues),
  fieldOfInterest: z.string().trim().min(1, "Field of interest is required"),
  goal: z.string().trim().min(1, "Goal is required"),
  referralCode: z.string().trim().optional(),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    // Guard against an account that already exists (also covers races).
    const existing = await getInternByEmail(body.email);
    if (existing) {
      return NextResponse.json(
        { error: "An account with this email already exists. Sign in instead." },
        { status: 409 }
      );
    }

    // Optional referral attribution. An invalid code is ignored rather than
    // blocking signup — the worst case is a missing referral credit.
    let referredBy: string | null = null;
    if (body.referralCode) {
      const ambassador = await getAmbassadorByReferralCode(body.referralCode);
      referredBy = ambassador?.id ?? null;
    }

    const record = await createIntern({
      email: body.email,
      fullName: body.fullName,
      college: body.college,
      courseType: body.courseType,
      fieldOfInterest: body.fieldOfInterest,
      goal: body.goal,
      referredBy,
    });

    await setSessionCookie({
      internId: record.intern.id,
      userId: record.user.id,
      email: record.user.email,
    });

    return NextResponse.json({ intern: toOnboardingIntern(record) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Signup error:", error);
    return NextResponse.json({ error: "Failed to create account" }, { status: 500 });
  }
}
