// src/app/api/auth/login/route.ts
import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { setSessionCookie } from "@/lib/auth";
import { getInternByEmail, toOnboardingIntern } from "@/lib/db/queries";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const record = await getInternByEmail(body.email);

    if (!record) {
      return NextResponse.json({ error: "No intern account found for this email." }, { status: 404 });
    }
    if (!record.user.isActive) {
      return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
    }
    if (!record.user.passwordHash) {
      return NextResponse.json(
        { error: "No password set yet. Verify your email to finish registration." },
        { status: 400 }
      );
    }

    const valid = await bcrypt.compare(body.password, record.user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
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
    console.error("Login error:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}