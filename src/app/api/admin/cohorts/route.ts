import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createCohort, listCohorts } from "@/lib/db/queries";

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  return NextResponse.json({ cohorts: await listCohorts() });
}

const dateString = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD")
  .optional()
  .nullable();

const postSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  description: z.string().trim().optional().nullable(),
  startsAt: dateString,
  endsAt: dateString,
  isActive: z.boolean().optional(),
});

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  try {
    const body = postSchema.parse(await request.json());
    const cohort = await createCohort({
      name: body.name,
      description: body.description ?? null,
      startsAt: body.startsAt ?? null,
      endsAt: body.endsAt ?? null,
      isActive: body.isActive ?? true,
    });
    return NextResponse.json({ cohort }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Cohort POST error:", error);
    return NextResponse.json({ error: "Failed to create cohort" }, { status: 500 });
  }
}
