// src/app/api/auth/otp/verify/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { getInternByEmail, toOnboardingIntern } from "@/lib/db/queries";
import { supabase } from "@/lib/storage";

const bodySchema = z.object({
  email: z.string().email(),
  token: z.string().length(6), // Supabase's default OTP length — see note below
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());

    const record = await getInternByEmail(body.email);
    if (!record) {
      return NextResponse.json({ error: "No intern account found for this email." }, { status: 404 });
    }

    const { error: verifyError } = await supabase.auth.verifyOtp({
      email: record.user.email, // canonical stored email, not raw user input
      token: body.token,
      type: "email",
    });

    if (verifyError) {
      return NextResponse.json(
        { error: "Invalid or expired code. Request a new one and try again." },
        { status: 401 }
      );
    }

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
    console.error("OTP verify error:", error);
    return NextResponse.json({ error: "Failed to verify code" }, { status: 500 });
  }
}