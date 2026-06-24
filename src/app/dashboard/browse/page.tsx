"use client";

import { useMemo, useState } from "react";
import { FilterChips } from "@/components/dashboard/primitives";
import { TaskGroupCard } from "@/components/dashboard/TaskGroupCard";
import { EmptyState } from "@/components/dashboard/primitives";
import type { ApplicationStatus } from "@/lib/dashboard-types";
import { getDashboardData } from "@/lib/mock/dashboard";

export default function BrowsePage() {
  const { taskGroups, applications } = getDashboardData();
  const [field, setField] = useState("All fields");
  const [query, setQuery] = useState("");

  const fields = useMemo(
    () => ["All fields", ...Array.from(new Set(taskGroups.map((g) => g.field)))],
    [taskGroups]
  );

  const statusFor = (groupId: string): ApplicationStatus =>
    applications.find((a) => a.taskGroupId === groupId)?.status ?? "not_applied";

  const filtered = taskGroups.filter((g) => {
    const matchesField = field === "All fields" || g.field === field;
    const q = query.trim().toLowerCase();
    const matchesQuery =
      !q ||
      g.title.toLowerCase().includes(q) ||
      g.description.toLowerCase().includes(q) ||
      g.requiredSkills.some((s) => s.toLowerCase().includes(q));
    return matchesField && matchesQuery;
  });

  return (
    <div className="space-y-7">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-[#0a0a0a]">
          Browse task groups
        </h1>
        <p className="mt-1.5 text-sm text-zinc-500">
          Find work that matches your field and skills, then apply to get
          assigned.
        </p>
      </div>

      <div className="space-y-4">
        <div className="field">
          <label className="sr-only" htmlFor="browse-search">
            Search
          </label>
          <input
            id="browse-search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by title, description, or skill…"
          />
        </div>
        <FilterChips options={fields} selected={field} onSelect={setField} />
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          title="No task groups match"
          description="Try a different field or clear your search."
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {filtered.map((g) => (
            <TaskGroupCard key={g.id} group={g} status={statusFor(g.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
