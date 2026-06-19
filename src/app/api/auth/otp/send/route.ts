// src/app/api/auth/otp/send/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getInternByEmail } from "@/lib/db/queries";
import { supabase } from "@/lib/storage";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const { email } = bodySchema.parse(await request.json());
    const record = await getInternByEmail(email);

    if (!record) {
      return NextResponse.json({ error: "No intern account found for this email." }, { status: 404 });
    }
    if (!record.user.isActive) {
      return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
    }
    if (record.user.passwordHash) {
      // Already has a password — don't let OTP be used to bypass login
      return NextResponse.json(
        { error: "This account already has a password. Log in instead." },
        { status: 400 }
      );
    }

    const { error } = await supabase.auth.signInWithOtp({
      email: record.user.email,
      options: { shouldCreateUser: true },
    });

    if (error) {
      console.error("OTP send error:", error);
      return NextResponse.json(
        { error: error.message || "Failed to send verification code" },
        { status: 502 }
      );
    }

    return NextResponse.json({ sent: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("OTP send route error:", error);
    return NextResponse.json({ error: "Failed to send verification code" }, { status: 500 });
  }
}