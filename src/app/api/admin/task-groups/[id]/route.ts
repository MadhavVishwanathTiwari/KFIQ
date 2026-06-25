import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { getTaskGroupDetail } from "@/lib/db/queries";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const { id } = await params;
  const detail = await getTaskGroupDetail(id);
  if (!detail) {
    return NextResponse.json({ error: "Task group not found" }, { status: 404 });
  }
  return NextResponse.json(detail);
}
