import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { setAdminSessionCookie } from "@/lib/admin-auth";
import { getAdminUserByEmail } from "@/lib/db/queries";

const bodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});

export async function POST(request: Request) {
  try {
    const body = bodySchema.parse(await request.json());
    const user = await getAdminUserByEmail(body.email);

    if (!user || !user.passwordHash) {
      return NextResponse.json(
        { error: "No admin account found. Set a password to claim your access." },
        { status: 404 }
      );
    }
    if (!user.isActive) {
      return NextResponse.json({ error: "Account is inactive." }, { status: 403 });
    }

    const valid = await bcrypt.compare(body.password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Incorrect password." }, { status: 401 });
    }

    await setAdminSessionCookie({ adminUserId: user.id, email: user.email });
    return NextResponse.json({ ok: true, email: user.email });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Admin login error:", error);
    return NextResponse.json({ error: "Failed to log in" }, { status: 500 });
  }
}
