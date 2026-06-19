import { mkdir, writeFile } from "fs/promises";
import path from "path";
import {
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";

const LOCAL_UPLOAD_DIR = path.join(process.cwd(), "uploads", "resumes");

function getS3Client() {
  const region = process.env.AWS_REGION;
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID;
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY;

  if (!region || !accessKeyId || !secretAccessKey) {
    return null;
  }

  return new S3Client({
    region,
    credentials: { accessKeyId, secretAccessKey },
  });
}

function buildObjectKey(internId: string, fileName: string) {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  return `resumes/${internId}/${Date.now()}-${safeName}`;
}

export async function uploadResumeFile(
  internId: string,
  file: File
): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());
  const bucket = process.env.AWS_S3_BUCKET;
  const client = getS3Client();

  if (client && bucket) {
    const key = buildObjectKey(internId, file.name);
    await client.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: key,
        Body: buffer,
        ContentType: file.type || "application/octet-stream",
      })
    );

    const baseUrl = process.env.AWS_S3_PUBLIC_BASE_URL;
    if (baseUrl) {
      return `${baseUrl.replace(/\/$/, "")}/${key}`;
    }

    return `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
  }

  await mkdir(LOCAL_UPLOAD_DIR, { recursive: true });
  const localName = `${internId}-${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
  const localPath = path.join(LOCAL_UPLOAD_DIR, localName);
  await writeFile(localPath, buffer);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  return `${appUrl}/api/uploads/resumes/${localName}`;
}
