import { NextRequest, NextResponse } from "next/server";
import { sql } from "drizzle-orm";
import { z } from "zod";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { db } from "@/lib/db";
import { internCertifications } from "@/lib/db/schema";

const bodySchema = z.object({
  name: z.string().min(1),
  issuingOrg: z.string().optional(),
  issuedDate: z.string().optional(),
  expiryDate: z.string().optional(),
  credentialUrl: z.string().url().optional().or(z.literal("")),
});

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const body = bodySchema.parse(await request.json());
    const [row] = await db
      .insert(internCertifications)
      .values({
        internId: session.internId,
        name: body.name.trim(),
        issuingOrg: body.issuingOrg?.trim() || null,
        issuedDate: body.issuedDate || null,
        expiryDate: body.expiryDate || null,
        credentialUrl: body.credentialUrl?.trim() || null,
        source: "manual",
      })
      .returning();

    return NextResponse.json(row);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Add certification error:", error);
    return NextResponse.json({ error: "Failed to add certification" }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const id = request.nextUrl.searchParams.get("id");
  if (!id) {
    return NextResponse.json({ error: "Certification id is required" }, { status: 400 });
  }

  await db
    .delete(internCertifications)
    .where(
      sql`${internCertifications.id} = ${id} AND ${internCertifications.internId} = ${session.internId} AND ${internCertifications.source} = 'manual'`
    );

  return NextResponse.json({ success: true });
}
