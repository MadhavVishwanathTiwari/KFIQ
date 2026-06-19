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
      if (!res.ok) {
        throw new Error(data.error ?? "Save failed");
      }
      await onChange();
      setMessage("Saved successfully");
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
        <h2 className="mb-2 text-xl font-bold">Enrich your profile</h2>
        <p className="text-slate-600">
          Add anything missing from your resume. Manual entries are stored with{" "}
          <code className="text-sm">source = manual</code> and can be removed.
          Resume-parsed rows are read-only here.
        </p>
      </div>

      {(message || error) && (
        <p
          className={`rounded-lg px-3 py-2 text-sm ${
            error ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"
          }`}
        >
          {error ?? message}
        </p>
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

      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
        <p className="font-semibold text-emerald-800">Registration complete</p>
        <p className="mt-1 text-sm text-emerald-700">
          Your profile is saved. You can return later to add more manual entries.
        </p>
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
    <div className="space-y-4 border-t border-slate-100 pt-6 first:border-t-0 first:pt-0">
      <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
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
    return <p className="text-sm text-slate-500">No entries yet.</p>;
  }

  return (
    <ul className="space-y-2">
      {items.map((item) => (
        <li
          key={item.id}
          className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm"
        >
          <span className="flex items-center gap-2">
            {item.label}
            <SourceBadge source={item.source} />
          </span>
          {item.source === "manual" && (
            <button
              type="button"
              className="text-xs font-semibold text-red-600"
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
      className="grid gap-3 sm:grid-cols-[1fr_auto]"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit("/api/profile/skills", { name });
        if (saved) setName("");
      }}
    >
      <div className="field">
        <label>Skill name</label>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. TypeScript"
          required
        />
      </div>
      <button type="submit" className="btn btn-secondary self-end" disabled={loading}>
        Add skill
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
      className="grid gap-3 sm:grid-cols-2"
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
      <div className="field sm:col-span-2">
        <label>Certification name</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </div>
      <div className="field">
        <label>Issuing organization</label>
        <input value={issuingOrg} onChange={(e) => setIssuingOrg(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-secondary self-end" disabled={loading}>
        Add certification
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
          required
        />
      </div>
      <div className="field">
        <label>Degree</label>
        <input value={degree} onChange={(e) => setDegree(e.target.value)} />
      </div>
      <div className="field">
        <label>Field of study</label>
        <input
          value={fieldOfStudy}
          onChange={(e) => setFieldOfStudy(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Start year</label>
        <input
          type="number"
          value={startYear}
          onChange={(e) => setStartYear(e.target.value)}
        />
      </div>
      <div className="field">
        <label>End year</label>
        <input
          type="number"
          value={endYear}
          onChange={(e) => setEndYear(e.target.value)}
        />
      </div>
      <div className="field sm:col-span-2">
        <label>Grade / CGPA</label>
        <input value={grade} onChange={(e) => setGrade(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-secondary w-fit" disabled={loading}>
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
        <input value={company} onChange={(e) => setCompany(e.target.value)} required />
      </div>
      <div className="field">
        <label>Role</label>
        <input value={role} onChange={(e) => setRole(e.target.value)} />
      </div>
      <div className="field sm:col-span-2">
        <label>Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <button type="submit" className="btn btn-secondary w-fit" disabled={loading}>
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
            ? techStack.split(",").map((s) => s.trim()).filter(Boolean)
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
        <input value={title} onChange={(e) => setTitle(e.target.value)} required />
      </div>
      <div className="field sm:col-span-2">
        <label>Description</label>
        <textarea
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="field">
        <label>Tech stack (comma-separated)</label>
        <input
          value={techStack}
          onChange={(e) => setTechStack(e.target.value)}
          placeholder="React, Node.js"
        />
      </div>
      <div className="field">
        <label>Project URL</label>
        <input
          type="url"
          value={projectUrl}
          onChange={(e) => setProjectUrl(e.target.value)}
          placeholder="https://github.com/..."
        />
      </div>
      <button type="submit" className="btn btn-secondary w-fit" disabled={loading}>
        Add project
      </button>
    </form>
  );
}
