"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { EmptyState } from "@/components/dashboard/primitives";
import { SkillTagInput } from "@/components/admin/SkillTagInput";
import type { AdminCohort, TaskGroupListItem } from "@/lib/admin-types";

export default function TaskGroupsPage() {
  const [groups, setGroups] = useState<TaskGroupListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  async function load() {
    const data = await fetch("/api/admin/task-groups").then((r) => r.json());
    setGroups(data.taskGroups ?? []);
    setLoading(false);
  }

  useEffect(() => {
    load();
  }, []);

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
            Task groups
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Each completed group earns the intern a certificate.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Close" : "New task group"}
        </button>
      </div>

      {showForm && (
        <NewTaskGroupForm
          onCreated={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : groups.length === 0 ? (
        <EmptyState
          title="No task groups yet"
          description="Create your first task group to start assigning work."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {groups.map((g) => (
            <Link
              key={g.id}
              href={`/admin/task-groups/${g.id}`}
              className="card p-5 hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="badge badge-manual">{g.field}</span>
                <span className="text-xs text-zinc-400">
                  {g.taskCount} task{g.taskCount === 1 ? "" : "s"}
                </span>
              </div>
              <p className="mt-3 font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
                {g.title}
              </p>
              {g.description && (
                <p className="mt-1 line-clamp-2 text-sm text-zinc-500">
                  {g.description}
                </p>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function NewTaskGroupForm({ onCreated }: { onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [field, setField] = useState("");
  const [description, setDescription] = useState("");
  const [skills, setSkills] = useState<string[]>([]);
  const [cohorts, setCohorts] = useState<AdminCohort[]>([]);
  const [cohortId, setCohortId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    fetch("/api/admin/cohorts")
      .then((r) => r.json())
      .then((data) => {
        const list: AdminCohort[] = data.cohorts ?? [];
        setCohorts(list);
        // Default to the first active cohort, if any.
        const active = list.find((c) => c.isActive);
        if (active) setCohortId(active.id);
      })
      .catch(() => {});
  }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      // Resolve skill names → ids (creating any new ones) before creating the group.
      let skillIds: string[] = [];
      if (skills.length > 0) {
        const res = await fetch("/api/admin/skills", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ names: skills }),
        });
        const data = await res.json();
        skillIds = data.skillIds ?? [];
      }

      const res = await fetch("/api/admin/task-groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          field,
          description,
          skillIds,
          cohortId: cohortId || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Failed to create.");
        return;
      }
      onCreated();
    } catch {
      setError("Network error — please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="tg-title">Title</label>
          <input
            id="tg-title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Web Development"
            required
          />
        </div>
        <div className="field">
          <label htmlFor="tg-field">Field</label>
          <input
            id="tg-field"
            value={field}
            onChange={(e) => setField(e.target.value)}
            placeholder="e.g. Frontend"
            required
          />
        </div>
      </div>
      <div className="field">
        <label htmlFor="tg-cohort">Cohort</label>
        <select
          id="tg-cohort"
          value={cohortId}
          onChange={(e) => setCohortId(e.target.value)}
        >
          <option value="">No cohort</option>
          {cohorts.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
              {c.isActive ? " (active)" : ""}
            </option>
          ))}
        </select>
      </div>
      <div className="field">
        <label htmlFor="tg-desc">Description</label>
        <textarea
          id="tg-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="What this group covers…"
        />
      </div>
      <SkillTagInput id="tg-skills" value={skills} onChange={setSkills} />

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <button type="submit" className="btn btn-primary" disabled={busy}>
        {busy ? "Creating…" : "Create task group"}
      </button>
    </form>
  );
}
