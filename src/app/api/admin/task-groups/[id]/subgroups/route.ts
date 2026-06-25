import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { createSubgroup } from "@/lib/db/queries";

const postSchema = z.object({
  title: z.string().trim().min(1, "Title is required"),
  description: z.string().trim().optional(),
  sequenceOrder: z.number().int().min(1).optional(),
  canRunConcurrent: z.boolean().optional(),
});

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;

  const { id } = await params;
  try {
    const body = postSchema.parse(await request.json());
    const subgroup = await createSubgroup({
      taskGroupId: id,
      title: body.title,
      description: body.description ?? null,
      sequenceOrder: body.sequenceOrder,
      canRunConcurrent: body.canRunConcurrent,
    });
    return NextResponse.json({ subgroup }, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Subgroup POST error:", error);
    return NextResponse.json({ error: "Failed to create subgroup" }, { status: 500 });
  }
}
