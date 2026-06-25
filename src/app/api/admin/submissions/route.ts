import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listSubmissionsForReview } from "@/lib/db/queries";

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  return NextResponse.json({ submissions: await listSubmissionsForReview() });
}
