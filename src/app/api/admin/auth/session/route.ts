import { NextResponse } from "next/server";
import { clearAdminSessionCookie, getAdminSessionFromCookies } from "@/lib/admin-auth";

// Returns the current admin session (for the layout's auth check).
export async function GET() {
  const session = await getAdminSessionFromCookies();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json({ admin: session });
}

// Sign out.
export async function DELETE() {
  await clearAdminSessionCookie();
  return NextResponse.json({ ok: true });
}
