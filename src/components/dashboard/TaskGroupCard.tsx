"use client";

import Link from "next/link";
import { ApplicationStatusPill, SkillBadges } from "./primitives";
import { countTasks, type ApplicationStatus, type TaskGroup } from "@/lib/dashboard-types";

export function TaskGroupCard({
  group,
  status,
}: {
  group: TaskGroup;
  status: ApplicationStatus;
}) {
  const subgroupCount = group.subgroups.length;
  return (
    <Link
      href={`/dashboard/browse/${group.id}`}
      className="card flex flex-col p-5 transition-shadow hover:shadow-md"
    >
      <div className="mb-2 flex items-start justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-widest text-zinc-400">
          {group.field}
        </span>
        <ApplicationStatusPill status={status} />
      </div>

      <p className="font-semibold text-[#0a0a0a]">{group.title}</p>
      <p className="mt-1 line-clamp-2 flex-1 text-sm text-zinc-500">
        {group.description}
      </p>

      <div className="mt-3.5">
        <SkillBadges skills={group.requiredSkills} />
      </div>

      <div className="mt-3.5 flex items-center gap-3 text-xs text-zinc-400">
        <span>{countTasks(group)} tasks</span>
        {subgroupCount > 0 && (
          <>
            <span aria-hidden>·</span>
            <span>{subgroupCount} tracks</span>
          </>
        )}
        {group.certificateOnComplete && (
          <>
            <span aria-hidden>·</span>
            <span className="font-semibold text-[#0a0a0a]">🎓 Certificate</span>
          </>
        )}
      </div>
    </Link>
  );
}
