import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { isKfiqDomainEmail, setAdminSessionCookie } from "@/lib/admin-auth";
import {
  createAdminUser,
  getUserByEmail,
  isEmailAllowlistedAdmin,
} from "@/lib/db/queries";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8, "Password must be at least 8 characters."),
});

// Claim flow: an allowlisted KFIQ email sets its password and becomes an admin.
// There is intentionally no open admin signup — both gates must pass.
export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const email = body.email.toLowerCase();

    if (!isKfiqDomainEmail(email)) {
      return NextResponse.json(
        { error: "Admin access is limited to KFIQ email addresses." },
        { status: 403 }
      );
    }

    if (!(await isEmailAllowlistedAdmin(email))) {
      return NextResponse.json(
        { error: "This email is not on the admin allowlist." },
        { status: 403 }
      );
    }

    const existing = await getUserByEmail(email);
    if (existing) {
      return NextResponse.json(
        { error: "An account already exists for this email. Sign in instead." },
        { status: 409 }
      );
    }

    const passwordHash = await bcrypt.hash(body.password, 10);
    const user = await createAdminUser(email, passwordHash);

    await setAdminSessionCookie({ adminUserId: user.id, email: user.email });
    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Admin register error:", error);
    return NextResponse.json({ error: "Failed to create admin account" }, { status: 500 });
  }
}
