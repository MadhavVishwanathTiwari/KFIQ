import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { getSessionFromRequest, unauthorizedResponse } from "@/lib/auth";
import { parseResumeFromSupabase, parseResumeWithSharpApi } from "@/lib/sharpapi";
import { db } from "@/lib/db";
import { getInternById } from "@/lib/db/queries";
import { interns } from "@/lib/db/schema";
import {
  clearResumeSourcedProfile,
  markResumeParsing,
  persistParsedResumeData,
} from "@/lib/parse-resume";
import { readFile } from "fs/promises";
import path from "path";

async function loadLocalResumeFile(resumeUrl: string): Promise<File | null> {
  const marker = "/api/uploads/resumes/";
  const index = resumeUrl.indexOf(marker);
  if (index === -1) return null;

  const fileName = resumeUrl.slice(index + marker.length);
  const filePath = path.join(process.cwd(), "uploads", "resumes", fileName);

  try {
    const buffer = await readFile(filePath);
    return new File([buffer], fileName, {
      type: "application/octet-stream",
    });
  } catch {
    return null;
  }
}

export async function POST(request: NextRequest) {
  const session = await getSessionFromRequest(request);
  if (!session) return unauthorizedResponse();

  try {
    const record = await getInternById(session.internId);
    if (!record) {
      return NextResponse.json({ error: "Intern not found" }, { status: 404 });
    }

    if (!record.intern.resumeUrl) {
      return NextResponse.json(
        { error: "Upload a resume before parsing" },
        { status: 400 }
      );
    }

    if (record.intern.resumeParseStatus === "done") {
      return NextResponse.json({
        resumeParseStatus: "done",
        message: "Resume already parsed",
      });
    }

    if (record.intern.resumeParseStatus === "processing") {
      return NextResponse.json({
        resumeParseStatus: "processing",
        message: "Resume parsing already in progress",
      });
    }

    await clearResumeSourcedProfile(session.internId);
    await markResumeParsing(session.internId, "processing");

    try {
      const localFile = await loadLocalResumeFile(record.intern.resumeUrl);
      const parsed = localFile
        ? await parseResumeWithSharpApi(localFile)
        : await parseResumeFromSupabase(record.intern.resumeUrl);

      await persistParsedResumeData(session.internId, parsed);
      await markResumeParsing(session.internId, "done");

      return NextResponse.json({
        resumeParseStatus: "done",
        parsedAt: new Date().toISOString(),
      });
    } catch (parseError) {
      console.error("Resume parse error:", parseError);
      await markResumeParsing(session.internId, "failed");
      return NextResponse.json(
        {
          resumeParseStatus: "failed",
          error:
            parseError instanceof Error
              ? parseError.message
              : "Resume parsing failed",
        },
        { status: 502 }
      );
    }
  } catch (error) {
    console.error("Resume parse route error:", error);
    await db
      .update(interns)
      .set({ resumeParseStatus: "failed", updatedAt: new Date() })
      .where(eq(interns.id, session.internId));
    return NextResponse.json({ error: "Failed to parse resume" }, { status: 500 });
  }
}
