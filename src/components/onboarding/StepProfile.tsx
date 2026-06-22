"use client";

import { useState } from "react";
import type { ProfileData } from "@/lib/types";
import { SourceBadge } from "@/components/onboarding/SourceBadge";

type Props = {
  profile: ProfileData;
  onChange: () => Promise<void>;
};

export function StepProfile({ profile, onChange }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function postJson(url: string, body: Record<string, unknown>) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Save failed");
      await onChange();
      setMessage("Saved");
      setTimeout(() => setMessage(null), 2000);
      return data;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Save failed");
      return null;
    } finally {
      setLoading(false);
    }
  }

  async function removeItem(url: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(url, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "Delete failed");
      }
      await onChange();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Delete failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="space-y-10">
      <div>
        <span className="inline-block rounded-full bg-zinc-100 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-zinc-500">
          Step 4
        </span>
        <h2 className="mt-3 font-display text-2xl font-bold tracking-tight text-[#0a0a0a]">
          Enrich your profile
        </h2>
        <p className="mt-2 text-sm leading-relaxed text-zinc-500">
          Add anything missing from your resume. Manual entries are stored with{" "}
          <code className="rounded bg-zinc-100 px-1 text-xs font-mono text-zinc-600">
            source = manual
          </code>{" "}
          and can be removed. Resume-parsed rows are read-only here.
        </p>
      </div>

      {/* Toast feedback */}
      {(message || error) && (
        <div
          className={`flex items-center gap-2.5 rounded-xl border px-4 py-3 text-sm font-medium ${
            error
              ? "border-red-200 bg-red-50 text-red-700"
              : "border-zinc-200 bg-zinc-50 text-[#0a0a0a]"
          }`}
        >
          <span
            className={`h-1.5 w-1.5 rounded-full flex-shrink-0 ${
              error ? "bg-red-500" : "bg-emerald-500"
            }`}
          />
          {error ?? message}
        </div>
      )}

      <ProfileSection title="Skills">
        <SkillForm loading={loading} onSubmit={postJson} />
        <ItemList
          items={profile.skills.map((s) => ({
            id: s.id,
            label: s.name,
            source: s.source,
          }))}
          onDelete={(id) => removeItem(`/api/profile/skills?id=${id}`)}
        />
      </ProfileSection>

      <ProfileSection title="Certifications">
        <CertificationForm loading={loading} onSubmit={postJson} />
        <ItemList
          items={profile.certifications.map((c) => ({
            id: c.id,
            label: c.issuingOrg ? `${c.name} — ${c.issuingOrg}` : c.name,
            source: c.source,
          }))}
          onDelete={(id) => removeItem(`/api/profile/certifications?id=${id}`)}
        />
      </ProfileSection>

      <ProfileSection title="Education">
        <EducationForm loading={loading} onSubmit={postJson} />
        <ItemList
          items={profile.education.map((e) => ({
            id: e.id,
            label: [e.institution, e.degree].filter(Boolean).join(" — "),
            source: e.source,
          }))}
          onDelete={(id) => removeItem(`/api/profile/education?id=${id}`)}
        />
      </ProfileSection>

      <ProfileSection title="Past internships">
        <InternshipForm loading={loading} onSubmit={postJson} />
        <ItemList
          items={profile.pastInternships.map((i) => ({
            id: i.id,
            label: [i.company, i.role].filter(Boolean).join(" — "),
            source: i.source,
          }))}
          onDelete={(id) => removeItem(`/api/profile/internships?id=${id}`)}
        />
      </ProfileSection>

      <ProfileSection title="Projects">
        <p className="-mt-1 text-sm text-zinc-400">
          Resume parsing doesn&apos;t capture projects — add them here.
        </p>
        <ProjectForm loading={loading} onSubmit={postJson} />
        <ItemList
          items={profile.projects.map((p) => ({
            id: p.id,
            label: p.title,
            source: p.source,
          }))}
          onDelete={(id) => removeItem(`/api/profile/projects?id=${id}`)}
        />
      </ProfileSection>

      {/* Completion banner */}
      <div className="flex items-start gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
        <span className="mt-0.5 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-[#0a0a0a] text-white text-sm">
          ✓
        </span>
        <div>
          <p className="font-semibold text-[#0a0a0a]">
            Registration complete
          </p>
          <p className="mt-0.5 text-sm text-zinc-500">
            Your profile is saved. Return anytime to add more entries.
          </p>
        </div>
      </div>
    </section>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-4 border-t border-zinc-100 pt-7 first:border-t-0 first:pt-0">
      <h3 className="font-display text-base font-bold tracking-tight text-[#0a0a0a]">
        {title}
      </h3>
      {children}
    </div>
  );
}

function ItemList({
  items,
  onDelete,
}: {
  items: { id: string; label: string; source: "resume" | "manual" }[];
  onDelete: (id: string) => void;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-zinc-400 italic">No entries yet.</p>
    );
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm"
        >
          <span className="flex items-center gap-2 min-w-0">
            <span className="truncate text-[#0a0a0a]">{item.label}</span>
            <SourceBadge source={item.source} />
          </span>
          {item.source === "manual" && (
            <button
              type="button"
              className="flex-shrink-0 text-xs font-semibold text-zinc-400 hover:text-red-600 transition-colors"
              onClick={() => onDelete(item.id)}
            >
              Remove
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-forms                                                            */
/* ------------------------------------------------------------------ */

function SkillForm({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (url: string, body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit("/api/profile/skills", { name });
        if (saved) setName("");
      }}
    >
      <div className="field flex-1">
        <label className="sr-only">Skill name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. TypeScript"
          required
        />
      </div>
      <button
        type="submit"
        className="btn btn-secondary self-start mt-0"
        disabled={loading}
      >
        Add
      </button>
    </form>
  );
}

function CertificationForm({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (url: string, body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [name, setName] = useState("");
  const [issuingOrg, setIssuingOrg] = useState("");
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit("/api/profile/certifications", {
          name,
          issuingOrg,
        });
        if (saved) {
          setName("");
          setIssuingOrg("");
        }
      }}
    >
      <div className="field">
        <label className="sr-only">Certification name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Certification name"
          required
        />
      </div>
      <div className="field">
        <label className="sr-only">Issuing organization</label>
        <input
          value={issuingOrg}
          onChange={(e) => setIssuingOrg(e.target.value)}
          placeholder="Issuing org (optional)"
        />
      </div>
      <button
        type="submit"
        className="btn btn-secondary self-start"
        disabled={loading}
      >
        Add
      </button>
    </form>
  );
}

function EducationForm({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (url: string, body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [institution, setInstitution] = useState("");
  const [degree, setDegree] = useState("");
  const [fieldOfStudy, setFieldOfStudy] = useState("");
  const [startYear, setStartYear] = useState("");
  const [endYear, setEndYear] = useState("");
  const [grade, setGrade] = useState("");

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit("/api/profile/education", {
          institution,
          degree,
          fieldOfStudy,
          startYear: startYear || undefined,
          endYear: endYear || undefined,
          grade,
        });
        if (saved) {
          setInstitution("");
          setDegree("");
          setFieldOfStudy("");
          setStartYear("");
          setEndYear("");
          setGrade("");
        }
      }}
    >
      <div className="field sm:col-span-2">
        <label>Institution</label>
        <input
          value={institution}
          onChange={(e) => setInstitution(e.target.value)}
          placeholder="University or college name"
          required
        />
      </div>
      <div className="field">
        <label>Degree</label>
        <input
          value={degree}
          onChange={(e) => setDegree(e.target.value)}
          placeholder="B.Tech, B.Sc…"
        />
      </div>
      <div className="field">
        <label>Field of study</label>
        <input
          value={fieldOfStudy}
          onChange={(e) => setFieldOfStudy(e.target.value)}
          placeholder="Computer Science…"
        />
      </div>
      <div className="field">
        <label>Start year</label>
        <input
          type="number"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
          placeholder="2021"
        />
      </div>
      <div className="field">
        <label>End year</label>
        <input
          type="number"
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
          placeholder="2025"
        />
      </div>
      <div className="field sm:col-span-2">
        <label>Grade / CGPA</label>
        <input
          value={grade}
          onChange={(e) => setGrade(e.target.value)}
          placeholder="8.4 CGPA"
        />
      </div>
      <button
        type="submit"
        className="btn btn-secondary w-fit"
        disabled={loading}
      >
        Add education
      </button>
    </form>
  );
}

function InternshipForm({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (url: string, body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [company, setCompany] = useState("");
  const [role, setRole] = useState("");
  const [description, setDescription] = useState("");

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit("/api/profile/internships", {
          company,
          role,
          description,
        });
        if (saved) {
          setCompany("");
          setRole("");
          setDescription("");
        }
      }}
    >
      <div className="field">
        <label>Company</label>
        <input
          value={company}
          onChange={(e) => setCompany(e.target.value)}
          placeholder="Company name"
          required
        />
      </div>
      <div className="field">
        <label>Role</label>
        <input
          value={role}
          onChange={(e) => setRole(e.target.value)}
          placeholder="Software Engineering Intern"
        />
      </div>
      <div className="field sm:col-span-2">
        <label>Description (optional)</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What did you do?"
        />
      </div>
      <button
        type="submit"
        className="btn btn-secondary w-fit"
        disabled={loading}
      >
        Add internship
      </button>
    </form>
  );
}

function ProjectForm({
  loading,
  onSubmit,
}: {
  loading: boolean;
  onSubmit: (url: string, body: Record<string, unknown>) => Promise<unknown>;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [techStack, setTechStack] = useState("");
  const [projectUrl, setProjectUrl] = useState("");

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit("/api/profile/projects", {
          title,
          description,
          techStack: techStack
            ? techStack
                .split(",")
                .map((s) => s.trim())
                .filter(Boolean)
            : [],
          projectUrl,
        });
        if (saved) {
          setTitle("");
          setDescription("");
          setTechStack("");
          setProjectUrl("");
        }
      }}
    >
      <div className="field sm:col-span-2">
        <label>Project title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="My portfolio project"
          required
        />
      </div>
      <div className="field sm:col-span-2">
        <label>Description (optional)</label>
        <textarea
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What does it do?"
        />
      </div>
      <div className="field">
        <label>Tech stack</label>
        <input
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          placeholder="React, Node.js, PostgreSQL"
        />
      </div>
      <div className="field">
        <label>Project URL</label>
        <input
          type="url"
          value={projectUrl}
          onChange={(e) => setProjectUrl(e.target.value)}
          placeholder="https://github.com/…"
        />
      </div>
      <button
        type="submit"
        className="btn btn-secondary w-fit"
        disabled={loading}
      >
        Add project
      </button>
    </form>
  );
}