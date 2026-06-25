import { NextResponse } from "next/server";
import { z } from "zod";
import { requireAdmin } from "@/lib/admin-auth";
import { getOrCreateSkills, listSkills } from "@/lib/db/queries";

export async function GET() {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  return NextResponse.json({ skills: await listSkills() });
}

const postSchema = z.object({
  names: z.array(z.string().trim().min(1)).min(1),
});

export async function POST(request: Request) {
  const session = await requireAdmin();
  if (session instanceof Response) return session;
  try {
    const body = postSchema.parse(await request.json());
    const ids = await getOrCreateSkills(body.names);
    return NextResponse.json({ skillIds: ids });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: error.flatten() }, { status: 400 });
    }
    console.error("Skills POST error:", error);
    return NextResponse.json({ error: "Failed to save skills" }, { status: 500 });
  }
}
