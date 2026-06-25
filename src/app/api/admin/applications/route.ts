import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/admin-auth";
import { listApplications } from "@/lib/db/queries";
import { applicationStatusEnum } from "@/lib/db/schema";

export async function GET(request: NextRequest) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const statusParam = request.nextUrl.searchParams.get("status");
  const status = applicationStatusEnum.enumValues.find((s) => s === statusParam);

  return NextResponse.json({ applications: await listApplications(status) });
}
