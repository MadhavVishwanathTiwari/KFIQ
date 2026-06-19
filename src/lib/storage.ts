import { createClient } from "@supabase/supabase-js";
import { mkdir, writeFile } from "fs/promises";
import path from "path";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
export const supabase = createClient(supabaseUrl, supabaseKey);

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads", "resumes");

export async function uploadResumeFile(
  internId: string,
  file: File
): Promise<string> {
  const buffer = await file.arrayBuffer();
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${internId}/${Date.now()}-${safeName}`;

  if (supabaseUrl && supabaseKey) {
    const { error } = await supabase.storage
      .from("resumes") // Ensure this bucket is created in your Supabase dashboard
      .upload(filePath, buffer, {
        contentType: file.type || "application/octet-stream",
        upsert: false,
      });

    if (error) throw new Error(`Supabase upload failed: ${error.message}`);
    
    // Store the path, not a full URL
    return filePath; 
  }

  // Fallback for local development
  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const localName = `${internId}-${Date.now()}-${safeName}`;
  const localPath = path.join(LOCAL_UPLOAD_DIR, localName);
  await writeFile(localPath, Buffer.from(buffer));

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/api/uploads/resumes/${localName}`;
}