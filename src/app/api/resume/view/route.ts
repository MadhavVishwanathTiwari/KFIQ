import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { getInternById } from "@/lib/db/queries";
import { supabase } from "@/lib/storage";

export async function GET(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  const record = await getInternById(session.internId);
  if (!record?.intern.resumeUrl) {
    return NextResponse.json({ error: "No resume uploaded" }, { status: 404 });
  }

  const resumeUrl = record.intern.resumeUrl;

  // Local dev: storage.ts stores a full http URL
  if (resumeUrl.startsWith("http")) {
    return NextResponse.redirect(resumeUrl);
  }

  // Supabase path (e.g. "internId/ts-filename.pdf"): generate 1-hour signed URL
  const { data, error } = await supabase.storage
    .from("resumes")
    .createSignedUrl(resumeUrl, 3600);

  if (error || !data?.signedUrl) {
    console.error("Signed URL error:", error);
    return NextResponse.json(
      { error: "Could not generate resume view URL" },
      { status: 502 }
    );
  }

  return NextResponse.redirect(data.signedUrl);
}
