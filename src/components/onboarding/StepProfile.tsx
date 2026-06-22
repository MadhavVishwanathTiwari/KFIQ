"use client";

import { useState } from "react";
import type { ProfileData } from "@/lib/types";

type Props = {
  profile: ProfileData;
  onChange: () => Promise<void>;
};

type SubmitFn = (body: Record<string, unknown>) => Promise<unknown>;

export function StepProfile({ profile, onChange }: Props) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendJson(
    url: string,
    method: "POST" | "PATCH",
    body: Record<string, unknown>
  ) {
    setLoading(true);
    setError(null);
    setMessage(null);
    try {
      const res = await fetch(url, {
        method,
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

  // Bound helpers used by the sections below.
  function addTo(url: string): SubmitFn {
    return (body) => sendJson(url, "POST", body);
  }
  function editAt(url: string): SubmitFn {
    return (body) => sendJson(url, "PATCH", body);
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
          Review what we pulled from your resume and add anything missing. Every
          entry can be edited or removed.
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
        <SkillForm loading={loading} onSubmit={addTo("/api/profile/skills")} />
        <EditableList
          items={profile.skills}
          getLabel={(s) => s.name}
          onDelete={(id) => removeItem(`/api/profile/skills?id=${id}`)}
          renderEdit={(s, done) => (
            <SkillForm
              loading={loading}
              submitLabel="Save"
              onCancel={done}
              initialValues={{ name: s.name }}
              onSubmit={async (body) => {
                const saved = await editAt(`/api/profile/skills?id=${s.id}`)(body);
                if (saved) done();
                return saved;
              }}
            />
          )}
        />
      </ProfileSection>

      <ProfileSection title="Certifications">
        <CertificationForm
          loading={loading}
          onSubmit={addTo("/api/profile/certifications")}
        />
        <EditableList
          items={profile.certifications}
          getLabel={(c) => (c.issuingOrg ? `${c.name} — ${c.issuingOrg}` : c.name)}
          onDelete={(id) => removeItem(`/api/profile/certifications?id=${id}`)}
          renderEdit={(c, done) => (
            <CertificationForm
              loading={loading}
              submitLabel="Save"
              onCancel={done}
              initialValues={{ name: c.name, issuingOrg: c.issuingOrg ?? "" }}
              onSubmit={async (body) => {
                const saved = await editAt(
                  `/api/profile/certifications?id=${c.id}`
                )(body);
                if (saved) done();
                return saved;
              }}
            />
          )}
        />
      </ProfileSection>

      <ProfileSection title="Education">
        <EducationForm
          loading={loading}
          onSubmit={addTo("/api/profile/education")}
        />
        <EditableList
          items={profile.education}
          getLabel={(e) => [e.institution, e.degree].filter(Boolean).join(" — ")}
          onDelete={(id) => removeItem(`/api/profile/education?id=${id}`)}
          renderEdit={(e, done) => (
            <EducationForm
              loading={loading}
              submitLabel="Save"
              onCancel={done}
              initialValues={{
                institution: e.institution,
                degree: e.degree ?? "",
                fieldOfStudy: e.fieldOfStudy ?? "",
                startYear: e.startYear?.toString() ?? "",
                endYear: e.endYear?.toString() ?? "",
                grade: e.grade ?? "",
              }}
              onSubmit={async (body) => {
                const saved = await editAt(
                  `/api/profile/education?id=${e.id}`
                )(body);
                if (saved) done();
                return saved;
              }}
            />
          )}
        />
      </ProfileSection>

      <ProfileSection title="Past internships">
        <InternshipForm
          loading={loading}
          onSubmit={addTo("/api/profile/internships")}
        />
        <EditableList
          items={profile.pastInternships}
          getLabel={(i) => [i.company, i.role].filter(Boolean).join(" — ")}
          onDelete={(id) => removeItem(`/api/profile/internships?id=${id}`)}
          renderEdit={(i, done) => (
            <InternshipForm
              loading={loading}
              submitLabel="Save"
              onCancel={done}
              initialValues={{
                company: i.company,
                role: i.role ?? "",
                description: i.description ?? "",
              }}
              onSubmit={async (body) => {
                const saved = await editAt(
                  `/api/profile/internships?id=${i.id}`
                )(body);
                if (saved) done();
                return saved;
              }}
            />
          )}
        />
      </ProfileSection>

      <ProfileSection title="Projects">
        <ProjectForm loading={loading} onSubmit={addTo("/api/profile/projects")} />
        <EditableList
          items={profile.projects}
          getLabel={(p) => p.title}
          onDelete={(id) => removeItem(`/api/profile/projects?id=${id}`)}
          renderEdit={(p, done) => (
            <ProjectForm
              loading={loading}
              submitLabel="Save"
              onCancel={done}
              initialValues={{
                title: p.title,
                description: p.description ?? "",
                techStack: (p.techStack ?? []).join(", "),
                projectUrl: p.projectUrl ?? "",
              }}
              onSubmit={async (body) => {
                const saved = await editAt(
                  `/api/profile/projects?id=${p.id}`
                )(body);
                if (saved) done();
                return saved;
              }}
            />
          )}
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

function EditableList<T extends { id: string }>({
  items,
  getLabel,
  onDelete,
  renderEdit,
}: {
  items: T[];
  getLabel: (item: T) => string;
  onDelete: (id: string) => void;
  renderEdit: (item: T, done: () => void) => React.ReactNode;
}) {
  const [editingId, setEditingId] = useState<string | null>(null);

  if (items.length === 0) {
    return <p className="text-sm text-zinc-400 italic">No entries yet.</p>;
  }

  return (
    <ul className="space-y-1.5">
      {items.map((item) => (
        <li
          key={item.id}
          className="rounded-lg border border-zinc-200 bg-white px-3.5 py-2.5 text-sm"
        >
          {editingId === item.id ? (
            renderEdit(item, () => setEditingId(null))
          ) : (
            <div className="flex items-center justify-between gap-3">
              <span className="truncate text-[#0a0a0a]">{getLabel(item)}</span>
              <div className="flex flex-shrink-0 items-center gap-3">
                <button
                  type="button"
                  className="text-xs font-semibold text-zinc-400 hover:text-[#0a0a0a] transition-colors"
                  onClick={() => setEditingId(item.id)}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="text-xs font-semibold text-zinc-400 hover:text-red-600 transition-colors"
                  onClick={() => onDelete(item.id)}
                >
                  Remove
                </button>
              </div>
            </div>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Sub-forms — used for both adding and inline editing                  */
/* ------------------------------------------------------------------ */

type FormProps<V> = {
  loading: boolean;
  onSubmit: (body: Record<string, unknown>) => Promise<unknown>;
  initialValues?: V;
  submitLabel?: string;
  onCancel?: () => void;
};

function CancelButton({
  onCancel,
  loading,
}: {
  onCancel?: () => void;
  loading: boolean;
}) {
  if (!onCancel) return null;
  return (
    <button
      type="button"
      className="btn btn-secondary w-fit"
      onClick={onCancel}
      disabled={loading}
    >
      Cancel
    </button>
  );
}

function SkillForm({
  loading,
  onSubmit,
  initialValues,
  submitLabel = "Add",
  onCancel,
}: FormProps<{ name: string }>) {
  const [name, setName] = useState(initialValues?.name ?? "");
  return (
    <form
      className="flex gap-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit({ name });
        if (saved && !onCancel) setName("");
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
        {submitLabel}
      </button>
      {onCancel && (
        <button
          type="button"
          className="btn btn-secondary self-start mt-0"
          onClick={onCancel}
          disabled={loading}
        >
          Cancel
        </button>
      )}
    </form>
  );
}

function CertificationForm({
  loading,
  onSubmit,
  initialValues,
  submitLabel = "Add",
  onCancel,
}: FormProps<{ name: string; issuingOrg: string }>) {
  const [name, setName] = useState(initialValues?.name ?? "");
  const [issuingOrg, setIssuingOrg] = useState(initialValues?.issuingOrg ?? "");
  return (
    <form
      className="grid gap-3 sm:grid-cols-[1fr_1fr_auto]"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit({ name, issuingOrg });
        if (saved && !onCancel) {
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
      <div className="flex gap-2">
        <button
          type="submit"
          className="btn btn-secondary self-start"
          disabled={loading}
        >
          {submitLabel}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary self-start"
            onClick={onCancel}
            disabled={loading}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}

function EducationForm({
  loading,
  onSubmit,
  initialValues,
  submitLabel = "Add education",
  onCancel,
}: FormProps<{
  institution: string;
  degree: string;
  fieldOfStudy: string;
  startYear: string;
  endYear: string;
  grade: string;
}>) {
  const [institution, setInstitution] = useState(
    initialValues?.institution ?? ""
  );
  const [degree, setDegree] = useState(initialValues?.degree ?? "");
  const [fieldOfStudy, setFieldOfStudy] = useState(
    initialValues?.fieldOfStudy ?? ""
  );
  const [startYear, setStartYear] = useState(initialValues?.startYear ?? "");
  const [endYear, setEndYear] = useState(initialValues?.endYear ?? "");
  const [grade, setGrade] = useState(initialValues?.grade ?? "");

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit({
          institution,
          degree,
          fieldOfStudy,
          startYear: startYear || undefined,
          endYear: endYear || undefined,
          grade,
        });
        if (saved && !onCancel) {
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
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn btn-secondary w-fit" disabled={loading}>
          {submitLabel}
        </button>
        <CancelButton onCancel={onCancel} loading={loading} />
      </div>
    </form>
  );
}

function InternshipForm({
  loading,
  onSubmit,
  initialValues,
  submitLabel = "Add internship",
  onCancel,
}: FormProps<{ company: string; role: string; description: string }>) {
  const [company, setCompany] = useState(initialValues?.company ?? "");
  const [role, setRole] = useState(initialValues?.role ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit({ company, role, description });
        if (saved && !onCancel) {
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
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn btn-secondary w-fit" disabled={loading}>
          {submitLabel}
        </button>
        <CancelButton onCancel={onCancel} loading={loading} />
      </div>
    </form>
  );
}

function ProjectForm({
  loading,
  onSubmit,
  initialValues,
  submitLabel = "Add project",
  onCancel,
}: FormProps<{
  title: string;
  description: string;
  techStack: string;
  projectUrl: string;
}>) {
  const [title, setTitle] = useState(initialValues?.title ?? "");
  const [description, setDescription] = useState(
    initialValues?.description ?? ""
  );
  const [techStack, setTechStack] = useState(initialValues?.techStack ?? "");
  const [projectUrl, setProjectUrl] = useState(initialValues?.projectUrl ?? "");

  return (
    <form
      className="grid gap-3 sm:grid-cols-2"
      onSubmit={async (e) => {
        e.preventDefault();
        const saved = await onSubmit({
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
        if (saved && !onCancel) {
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
      <div className="flex gap-2 sm:col-span-2">
        <button type="submit" className="btn btn-secondary w-fit" disabled={loading}>
          {submitLabel}
        </button>
        <CancelButton onCancel={onCancel} loading={loading} />
      </div>
    </form>
  );
}
