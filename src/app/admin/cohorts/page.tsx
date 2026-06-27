"use client";

import { useCallback, useEffect, useState } from "react";
import { EmptyState } from "@/components/dashboard/primitives";
import type { AdminCohort } from "@/lib/admin-types";

export default function CohortsPage() {
  const [cohorts, setCohorts] = useState<AdminCohort[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);

  const load = useCallback(async () => {
    const data = await fetch("/api/admin/cohorts").then((r) => r.json());
    setCohorts(data.cohorts ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div className="space-y-7">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
            Cohorts
          </h1>
          <p className="mt-1.5 text-sm text-zinc-500">
            Group interns and task groups by intake. Task groups can be linked to a
            cohort.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => setShowForm((v) => !v)}
        >
          {showForm ? "Close" : "New cohort"}
        </button>
      </div>

      {showForm && (
        <CohortForm
          onDone={() => {
            setShowForm(false);
            load();
          }}
        />
      )}

      {loading ? (
        <p className="text-sm text-zinc-400">Loading…</p>
      ) : cohorts.length === 0 ? (
        <EmptyState
          title="No cohorts yet"
          description="Create a cohort to start grouping interns and task groups."
        />
      ) : (
        <div className="space-y-3">
          {cohorts.map((c) => (
            <CohortRow key={c.id} cohort={c} onChanged={load} />
          ))}
        </div>
      )}
    </div>
  );
}

function fmtDate(d: string | null) {
  if (!d) return null;
  // Values are plain YYYY-MM-DD date strings.
  return new Date(`${d}T00:00:00`).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

function CohortRow({
  cohort,
  onChanged,
}: {
  cohort: AdminCohort;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function toggleActive() {
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/cohorts/${cohort.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !cohort.isActive }),
    });
    setBusy(false);
    if (res.ok) onChanged();
    else setError("Failed to update.");
  }

  async function remove() {
    if (
      !window.confirm(
        `Delete cohort "${cohort.name}"? Linked interns and task groups will be kept but unlinked.`
      )
    )
      return;
    setBusy(true);
    setError(null);
    const res = await fetch(`/api/admin/cohorts/${cohort.id}`, {
      method: "DELETE",
    });
    setBusy(false);
    if (res.ok) onChanged();
    else setError("Failed to delete.");
  }

  if (editing) {
    return (
      <CohortForm
        cohort={cohort}
        onDone={() => {
          setEditing(false);
          onChanged();
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  const starts = fmtDate(cohort.startsAt);
  const ends = fmtDate(cohort.endsAt);

  return (
    <div className="card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="font-semibold text-[#0a0a0a]">{cohort.name}</p>
            <span
              className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold ${
                cohort.isActive
                  ? "bg-emerald-50 text-emerald-700 border-emerald-200"
                  : "bg-zinc-100 text-zinc-500 border-zinc-200"
              }`}
            >
              {cohort.isActive ? "Active" : "Inactive"}
            </span>
          </div>
          {cohort.description && (
            <p className="mt-1 text-sm text-zinc-600">{cohort.description}</p>
          )}
          <p className="mt-1.5 text-xs text-zinc-400">
            {starts || ends ? (
              <>
                {starts ?? "—"} → {ends ?? "—"} ·{" "}
              </>
            ) : null}
            {cohort.taskGroupCount} task group
            {cohort.taskGroupCount === 1 ? "" : "s"} · {cohort.internCount} intern
            {cohort.internCount === 1 ? "" : "s"}
          </p>
          {error && (
            <p className="mt-1.5 text-sm font-medium text-red-600">{error}</p>
          )}
        </div>

        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={toggleActive}
            disabled={busy}
          >
            {cohort.isActive ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => setEditing(true)}
            disabled={busy}
          >
            Edit
          </button>
          <button
            type="button"
            className="btn btn-secondary !text-red-600"
            onClick={remove}
            disabled={busy}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

function CohortForm({
  cohort,
  onDone,
  onCancel,
}: {
  cohort?: AdminCohort;
  onDone: () => void;
  onCancel?: () => void;
}) {
  const isEdit = Boolean(cohort);
  const [name, setName] = useState(cohort?.name ?? "");
  const [description, setDescription] = useState(cohort?.description ?? "");
  const [startsAt, setStartsAt] = useState(cohort?.startsAt ?? "");
  const [endsAt, setEndsAt] = useState(cohort?.endsAt ?? "");
  const [isActive, setIsActive] = useState(cohort?.isActive ?? true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    const body = {
      name,
      description: description.trim() || null,
      startsAt: startsAt || null,
      endsAt: endsAt || null,
      isActive,
    };
    const res = await fetch(
      isEdit ? `/api/admin/cohorts/${cohort!.id}` : "/api/admin/cohorts",
      {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );
    setBusy(false);
    if (res.ok) {
      onDone();
    } else {
      const data = await res.json().catch(() => ({}));
      setError(typeof data.error === "string" ? data.error : "Failed to save.");
    }
  }

  return (
    <form onSubmit={submit} className="card space-y-4 p-6">
      <div className="field">
        <label htmlFor="co-name">Name</label>
        <input
          id="co-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Summer 2026"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="co-desc">Description</label>
        <textarea
          id="co-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          placeholder="Optional notes about this cohort…"
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="field">
          <label htmlFor="co-start">Starts</label>
          <input
            id="co-start"
            type="date"
            value={startsAt ?? ""}
            onChange={(e) => setStartsAt(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="co-end">Ends</label>
          <input
            id="co-end"
            type="date"
            value={endsAt ?? ""}
            onChange={(e) => setEndsAt(e.target.value)}
          />
        </div>
      </div>
      <label className="flex items-center gap-2 text-sm text-zinc-600">
        <input
          type="checkbox"
          checked={isActive}
          onChange={(e) => setIsActive(e.target.checked)}
        />
        Active
      </label>

      {error && <p className="text-sm font-medium text-red-600">{error}</p>}

      <div className="flex gap-2">
        <button type="submit" className="btn btn-primary" disabled={busy}>
          {busy ? "Saving…" : isEdit ? "Save changes" : "Create cohort"}
        </button>
        {onCancel && (
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onCancel}
          >
            Cancel
          </button>
        )}
      </div>
    </form>
  );
}
