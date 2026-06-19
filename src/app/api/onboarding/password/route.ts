import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { getInternById, setUserPassword } from "@/lib/db/queries";

const bodySchema = z.object({
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const body = bodySchema.parse(await request.json());
    const record = await getInternById(session.internId);

    if (!record) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    const passwordHash = await bcrypt.hash(body.password, 12);
    await setUserPassword(session.userId, passwordHash);

    return NextResponse.json({ success: true });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Password set error:", error);
    return NextResponse.json({ error: "Failed to set password" }, { status: 500 });
  }
}
