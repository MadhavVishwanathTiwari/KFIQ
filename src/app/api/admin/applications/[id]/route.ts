import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { listAssignableTasks } from "@/lib/db/queries";
import { applications } from "@/lib/db/schema";

// Returns the tasks an admin can assign when approving this application
// (i.e. tasks in the application's group not yet claimed by anyone).
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const { id } = await params;
  const [application] = await db
    .select()
    .from(applications)
    .where(eq(applications.id, id))
    .limit(1);
  if (!application) {
    return NextResponse.json({ error: "Application not found" }, { status: 404 });
  }

  const assignableTasks = await listAssignableTasks(application.taskGroupId);
  return NextResponse.json({ application, assignableTasks });
}
