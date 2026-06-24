// src/app/api/auth/check-email/route.ts
import { NextResponse } from "next/server";
import { z } from "zod";
import { getInternByEmail } from "@/lib/db/queries";

const bodySchema = z.object({ email: z.string().email() });

export async function POST(request: Request) {
  try {
    const { email } = bodySchema.parse(await request.json());
    const record = await getInternByEmail(email);

    // Unknown email is not an error — the client branches into in-app signup.
    if (!record) {
      return NextResponse.json({ exists: false });
    }
    if (!record.user.isActive) {
      return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
    }

    const phone = (record.intern as any).phone;
    const maskedPhone = phone ? phone.replace(/.(?=.{4})/g, '*') : null;

    return NextResponse.json({
      exists: true,
      hasPassword: Boolean(record.user.passwordHash),
      hasPhone: Boolean(phone),
      maskedPhone
    });
  } catch (error) {
    if (error instanceof z.ZodError) return NextResponse.json({ error: error.flatten() }, { status: 400 });
    return NextResponse.json({ error: "Failed to check email" }, { status: 500 });
  }
}