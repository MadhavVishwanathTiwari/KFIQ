"use client";

import { use, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import type { AdminSubgroup, AdminTask, TaskGroupDetail } from "@/lib/admin-types";

async function resolveSkillIds(skillsText: string): Promise<string[]> {
  const names = skillsText
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (names.length === 0) return [];
  const res = await fetch("/api/admin/skills", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ names }),
  });
  const data = await res.json();
  return data.skillIds ?? [];
}

export default function TaskGroupDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [detail, setDetail] = useState<TaskGroupDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const res = await fetch(`/api/admin/task-groups/${id}`);
    if (res.ok) setDetail(await res.json());
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) return <p className="text-sm text-zinc-400">Loading…</p>;
  if (!detail)
    return (
      <div className="space-y-4">
        <p className="text-sm text-zinc-500">Task group not found.</p>
        <Link href="/admin/task-groups" className="btn btn-secondary">
          Back to task groups
        </Link>
      </div>
    );

  return (
    <div className="space-y-8">
      <div>
        <Link
          href="/admin/task-groups"
          className="text-sm font-medium text-zinc-400 hover:text-[#0a0a0a]"
        >
          ← Task groups
        </Link>
        <div className="mt-2 flex items-center gap-2">
          <span className="badge badge-manual">{detail.group.field}</span>
          {!detail.group.isOpen && (
            <span className="badge badge-resume">Closed</span>
          )}
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
          {detail.group.title}
        </h1>
        {detail.group.description && (
          <p className="mt-1.5 text-sm text-zinc-500">{detail.group.description}</p>
        )}
        {detail.skills.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {detail.skills.map((s) => (
              <span key={s.id} className="badge badge-sm">
                {s.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Direct tasks */}
      <section className="space-y-3">
        <h2 className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
          Direct tasks
        </h2>
        <TaskList tasks={detail.directTasks} emptyLabel="No direct tasks." />
        <AddTaskForm groupId={id} onAdded={load} />
      </section>

      {/* Subgroups */}
      <section className="space-y-4">
        <h2 className="font-display text-lg font-bold tracking-tight text-[#0a0a0a]">
          Subgroups
        </h2>
        {detail.subgroups.map((sg) => (
          <SubgroupBlock key={sg.id} groupId={id} subgroup={sg} onAdded={load} />
        ))}
        <AddSubgroupForm groupId={id} onAdded={load} />
      </section>
    </div>
  );
}

function TaskList({
  tasks,
  emptyLabel,
}: {
  tasks: AdminTask[];
  emptyLabel: string;
}) {
  if (tasks.length === 0)
    return <p className="text-sm text-zinc-400">{emptyLabel}</p>;
  return (
    <ul className="space-y-2">
      {tasks.map((t) => (
        <li key={t.id} className="card flex items-start justify-between gap-3 p-4">
          <div>
            <p className="text-sm font-semibold text-[#0a0a0a]">{t.title}</p>
            {t.description && (
              <p className="mt-0.5 text-sm text-zinc-500">{t.description}</p>
            )}
          </div>
          <span className="shrink-0 text-xs text-zinc-400">
            #{t.sequenceOrder}
            {t.canRunConcurrent ? " · concurrent" : ""}
          </span>
        </li>
      ))}
    </ul>
  );
}

function SubgroupBlock({
  groupId,
  subgroup,
  onAdded,
}: {
  groupId: string;
  subgroup: AdminSubgroup;
  onAdded: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 p-4">
      <div className="flex items-center justify-between gap-2">
        <p className="font-semibold text-[#0a0a0a]">{subgroup.title}</p>
        <span className="text-xs text-zinc-400">
          seq #{subgroup.sequenceOrder}
          {subgroup.canRunConcurrent ? " · concurrent" : ""}
        </span>
      </div>
      {subgroup.description && (
        <p className="mt-0.5 text-sm text-zinc-500">{subgroup.description}</p>
      )}
      <div className="mt-3">
        <TaskList tasks={subgroup.tasks} emptyLabel="No tasks in this subgroup." />
      </div>
      <div className="mt-3">
        <AddTaskForm groupId={groupId} subgroupId={subgroup.id} onAdded={onAdded} />
      </div>
    </div>
  );
}

function AddSubgroupForm({
  groupId,
  onAdded,
}: {
  groupId: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState(1);
  const [canRunConcurrent, setCanRunConcurrent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open)
    return (
      <button type="button" className="btn btn-secondary" onClick={() => setOpen(true)}>
        Add subgroup
      </button>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/task-groups/${groupId}/subgroups`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description, sequenceOrder, canRunConcurrent }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Failed.");
        return;
      }
      setTitle("");
      setDescription("");
      setOpen(false);
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-3 p-4">
      <div className="field">
        <label htmlFor="sg-title">Subgroup title</label>
        <input
          id="sg-title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor="sg-desc">Description</label>
        <textarea
          id="sg-desc"
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="field w-28">
          <label htmlFor="sg-seq">Sequence</label>
          <input
            id="sg-seq"
            type="number"
            min={1}
            value={sequenceOrder}
            onChange={(e) => setSequenceOrder(Number(e.target.value))}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={canRunConcurrent}
            onChange={(e) => setCanRunConcurrent(e.target.checked)}
          />
          Runs concurrently with previous
        </label>
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Adding…" : "Add subgroup"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function AddTaskForm({
  groupId,
  subgroupId,
  onAdded,
}: {
  groupId: string;
  subgroupId?: string;
  onAdded: () => void;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [skillsText, setSkillsText] = useState("");
  const [sequenceOrder, setSequenceOrder] = useState(1);
  const [canRunConcurrent, setCanRunConcurrent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open)
    return (
      <button
        type="button"
        className="btn btn-secondary"
        onClick={() => setOpen(true)}
      >
        {subgroupId ? "Add task to subgroup" : "Add direct task"}
      </button>
    );

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const requiredSkills = await resolveSkillIds(skillsText);
      const res = await fetch(`/api/admin/task-groups/${groupId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          description,
          subgroupId: subgroupId ?? null,
          requiredSkills,
          sequenceOrder,
          canRunConcurrent,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(typeof data.error === "string" ? data.error : "Failed.");
        return;
      }
      setTitle("");
      setDescription("");
      setSkillsText("");
      setOpen(false);
      onAdded();
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="card mt-2 space-y-3 p-4">
      <div className="field">
        <label htmlFor={`t-title-${subgroupId ?? "direct"}`}>Task title</label>
        <input
          id={`t-title-${subgroupId ?? "direct"}`}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        />
      </div>
      <div className="field">
        <label htmlFor={`t-desc-${subgroupId ?? "direct"}`}>Description</label>
        <textarea
          id={`t-desc-${subgroupId ?? "direct"}`}
          rows={2}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={`t-skills-${subgroupId ?? "direct"}`}>
          Required skills (comma-separated)
        </label>
        <input
          id={`t-skills-${subgroupId ?? "direct"}`}
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          placeholder="React, CSS"
        />
      </div>
      <div className="flex flex-wrap items-end gap-4">
        <div className="field w-28">
          <label htmlFor={`t-seq-${subgroupId ?? "direct"}`}>Sequence</label>
          <input
            id={`t-seq-${subgroupId ?? "direct"}`}
            type="number"
            min={1}
            value={sequenceOrder}
            onChange={(e) => setSequenceOrder(Number(e.target.value))}
          />
        </div>
        <label className="flex items-center gap-2 pb-2 text-sm text-zinc-600">
          <input
            type="checkbox"
            checked={canRunConcurrent}
            onChange={(e) => setCanRunConcurrent(e.target.checked)}
          />
          Concurrent
        </label>
      </div>
      {error && <p className="text-sm font-medium text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Adding…" : "Add task"}
        </button>
        <button
          type="button"
          className="btn btn-secondary"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
