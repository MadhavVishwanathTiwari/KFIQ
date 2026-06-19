import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { getInternById } from "@/lib/db/queries";
import { setResumePending } from "@/lib/parse-resume";
import { uploadResumeFile } from "@/lib/storage";

const MAX_FILE_SIZE = 10 * 1024 * 1024;
const ALLOWED_TYPES = new Set([
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
]);

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const record = await getInternById(session.internId);
    if (!record) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    const formData = await request.formData();
    const file = formData.get("resume");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Resume file is required" }, { status: 400 });
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "Resume must be 10 MB or smaller" },
        { status: 400 }
      );
    }

    if (file.type && !ALLOWED_TYPES.has(file.type)) {
      return NextResponse.json(
        { error: "Only PDF and Word documents are supported" },
        { status: 400 }
      );
    }

    const resumeUrl = await uploadResumeFile(session.internId, file);
    await setResumePending(session.internId, resumeUrl);

    return NextResponse.json({
      resumeUrl,
      resumeParseStatus: "pending",
    });
  } catch (error) {
    console.error("Resume upload error:", error);
    return NextResponse.json({ error: "Failed to upload resume" }, { status: 500 });
  }
}
