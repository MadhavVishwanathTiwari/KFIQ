// src/app/api/auth/check-email/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getInternByEmail } from "@/lib/db/queries";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const { email } = bodySchema.parse(await request.json());
    const record = await getInternByEmail(email);

    if (!record) {
      return NextResponse.json(
        { error: "No intern account found for this email. Sign up on the landing page first." },
        { status: 404 }
      );
    }
    if (!record.user.isActive) {
      return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
    }

    return NextResponse.json({ hasPassword: Boolean(record.user.passwordHash) });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Check email error:", error);
    return NextResponse.json({ error: "Failed to check email" }, { status: 500 });
  }
}