import type { ParsedResumeData } from "@/lib/resume-parser-types";
import { supabase } from "@/lib/storage";

type SharpApiPosition = {
  position_name?: string | null;
  company_name?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  skills?: string[] | null;
  job_details?: string | null;
};

type SharpApiEducation = {
  school_name?: string | null;
  degree_type?: string | null;
  specialization_subjects?: string | null;
  start_date?: string | null;
  end_date?: string | null;
};

// Mirrors the documented SharpAPI parse_resume "result" attributes. Note that
// SharpAPI returns skills only nested inside positions, and has no projects
// field — see https://sharpapi.com/en/catalog/ai/hr-tech/resume-cv-parsing
type SharpApiResumeResult = {
  candidate_courses_and_certifications?: unknown[] | null;
  candidate_honors_and_awards?: string[] | null;
  positions?: SharpApiPosition[] | null;
  education_qualifications?: SharpApiEducation[] | null;
};

type SharpApiJobResponse = {
  status_url?: string;
  job_id?: string;
};

type SharpApiStatusResponse = {
  data?: {
    attributes?: {
      status?: string;
      result?: SharpApiResumeResult;
      error?: string | null;
    };
  };
};

const SHARPAPI_BASE_URL =
  process.env.SHARPAPI_API_BASE_URL ?? "https://sharpapi.com";

function authHeaders(apiKey: string): HeadersInit {
  return {
    Accept: "application/json",
    Authorization: `Bearer ${apiKey}`,
  };
}

function dateOnly(value?: string | null): string | null {
  if (!value) return null;
  return value.slice(0, 10);
}

function asCertificationName(item: unknown): string | null {
  if (typeof item === "string" && item.trim()) return item.trim();
  if (item && typeof item === "object" && "name" in item) {
    const name = (item as { name?: unknown }).name;
    if (typeof name === "string" && name.trim()) return name.trim();
  }
  return null;
}

export function mapSharpApiResult(result: SharpApiResumeResult): ParsedResumeData {
  const skillSet = new Set<string>();

  for (const position of result.positions ?? []) {
    for (const skill of position.skills ?? []) {
      if (skill?.trim()) skillSet.add(skill.trim());
    }
  }

  const certifications: string[] = [];
  for (const item of result.candidate_courses_and_certifications ?? []) {
    const name = asCertificationName(item);
    if (name) certifications.push(name);
  }
  for (const award of result.candidate_honors_and_awards ?? []) {
    if (award?.trim()) certifications.push(award.trim());
  }

  return {
    skills: [...skillSet].map((name) => ({ name })),
    certifications,
    education: (result.education_qualifications ?? [])
      .filter((edu) => edu.school_name?.trim())
      .map((edu) => ({
        organization: edu.school_name!.trim(),
        degree: edu.degree_type?.trim() || null,
        fieldOfStudy: edu.specialization_subjects?.trim() || null,
        startDate: dateOnly(edu.start_date),
        endDate: dateOnly(edu.end_date),
        grade: null,
      })),
    workExperience: (result.positions ?? [])
      .filter((position) => position.company_name?.trim())
      .map((position) => ({
        organization: position.company_name!.trim(),
        jobTitle: position.position_name?.trim() || null,
        jobDescription: position.job_details?.trim() || null,
        startDate: dateOnly(position.start_date),
        endDate: dateOnly(position.end_date),
      })),
  };
}

async function submitResumeJob(file: File, apiKey: string): Promise<string> {
  const formData = new FormData();
  formData.append("cv", file);
  formData.append("language", "English");

  const response = await fetch(`${SHARPAPI_BASE_URL}/api/v1/hr/parse_resume`, {
    method: "POST",
    headers: authHeaders(apiKey),
    body: formData,
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new Error(`SharpAPI upload failed (${response.status}): ${detail}`);
  }

  const json = (await response.json()) as SharpApiJobResponse;
  const statusUrl =
    json.status_url ??
    (json.job_id
      ? `${SHARPAPI_BASE_URL}/api/v1/hr/parse_resume/job/status/${json.job_id}`
      : null);

  if (!statusUrl) {
    throw new Error("SharpAPI did not return a job status URL");
  }

  return statusUrl;
}

async function pollResumeJob(
  statusUrl: string,
  apiKey: string
): Promise<ParsedResumeData> {
  for (let attempt = 0; attempt < 40; attempt++) {
    const response = await fetch(statusUrl, {
      headers: authHeaders(apiKey),
    });

    if (!response.ok) {
      const detail = await response.text();
      throw new Error(
        `SharpAPI status check failed (${response.status}): ${detail}`
      );
    }

    const json = (await response.json()) as SharpApiStatusResponse;
    const attributes = json.data?.attributes;
    const status = attributes?.status?.toLowerCase();

    if (status === "failed" || status === "error") {
      throw new Error(attributes?.error ?? "SharpAPI resume parsing failed");
    }

    if (status === "success" && attributes?.result) {
      console.log("[SharpAPI] raw result:", JSON.stringify(attributes.result, null, 2));
      return mapSharpApiResult(attributes.result);
    }

    await new Promise((resolve) => setTimeout(resolve, 2000));
  }

  throw new Error("SharpAPI resume parsing timed out");
}

function mockParsedResumeData(): ParsedResumeData {
  return {
    skills: [
      { name: "JavaScript" },
      { name: "React" },
      { name: "Node.js" },
      { name: "PostgreSQL" },
    ],
    certifications: ["AWS Cloud Practitioner"],
    education: [
      {
        organization: "Example Institute of Technology",
        degree: "Bachelor's Degree or equivalent",
        fieldOfStudy: "Computer Science",
        startDate: "2020-07-01",
        endDate: "2024-06-01",
        grade: "8.5 CGPA",
      },
    ],
    workExperience: [
      {
        organization: "Acme Corp",
        jobTitle: "Software Engineering Intern",
        jobDescription: "Built internal dashboards and REST APIs.",
        startDate: "2023-05-01",
        endDate: "2023-08-01",
      },
    ],
  };
}

export async function parseResumeWithSharpApi(
  file: File
): Promise<ParsedResumeData> {
  const apiKey = process.env.SHARPAPI_API_KEY;
  if (!apiKey) {
    return mockParsedResumeData();
  }

  const statusUrl = await submitResumeJob(file, apiKey);
  return pollResumeJob(statusUrl, apiKey);
}

export async function parseResumeFromSupabase(
  filePath: string
): Promise<ParsedResumeData> {
  const apiKey = process.env.SHARPAPI_API_KEY;
  if (!apiKey) {
    return mockParsedResumeData();
  }

  const { data, error } = await supabase.storage
    .from("resumes")
    .download(filePath);

  if (error || !data) {
    throw new Error(`Failed to download resume from Supabase (403/404): ${error?.message || "Unknown"}`);
  }

  const buffer = await data.arrayBuffer();
  const fileName = filePath.split("/").pop() || "resume.pdf";
  const file = new File([buffer], fileName, {
    type: data.type,
  });

  return parseResumeWithSharpApi(file);
}
