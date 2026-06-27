"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import type { AdminSkill } from "@/lib/admin-types";

/**
 * Notion-style tag input for skills. Manages an array of skill *names*
 * (case-insensitive, de-duplicated). Existing skills are suggested from the
 * master list; typing a new name and pressing Enter stages it as a new skill —
 * the parent resolves names → ids via POST /api/admin/skills on submit, which
 * creates any that don't exist yet.
 */
export function SkillTagInput({
  value,
  onChange,
  label = "Required skills",
  id = "skill-tag-input",
}: {
  value: string[];
  onChange: (skills: string[]) => void;
  label?: string;
  id?: string;
}) {
  const [allSkills, setAllSkills] = useState<AdminSkill[]>([]);
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const [highlight, setHighlight] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/admin/skills")
      .then((r) => r.json())
      .then((data) => setAllSkills(data.skills ?? []))
      .catch(() => {});
  }, []);

  // Close the dropdown when clicking away.
  useEffect(() => {
    function onDocClick(e: MouseEvent) {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", onDocClick);
    return () => document.removeEventListener("mousedown", onDocClick);
  }, []);

  const selectedLower = useMemo(
    () => new Set(value.map((v) => v.toLowerCase())),
    [value]
  );

  const trimmed = query.trim();

  const suggestions = useMemo(() => {
    const q = trimmed.toLowerCase();
    return allSkills
      .filter((s) => !selectedLower.has(s.name.toLowerCase()))
      .filter((s) => (q ? s.name.toLowerCase().includes(q) : true))
      .slice(0, 8);
  }, [allSkills, selectedLower, trimmed]);

  const canCreate =
    trimmed.length > 0 &&
    !allSkills.some((s) => s.name.toLowerCase() === trimmed.toLowerCase()) &&
    !selectedLower.has(trimmed.toLowerCase());

  type Option = { kind: "existing" | "create"; name: string };
  const options = useMemo<Option[]>(() => {
    const opts: Option[] = suggestions.map((s) => ({
      kind: "existing",
      name: s.name,
    }));
    if (canCreate) opts.push({ kind: "create", name: trimmed });
    return opts;
  }, [suggestions, canCreate, trimmed]);

  function addSkill(name: string) {
    const clean = name.trim();
    if (!clean || selectedLower.has(clean.toLowerCase())) {
      setQuery("");
      return;
    }
    // Prefer the canonical casing from the master list if it already exists.
    const canonical = allSkills.find(
      (s) => s.name.toLowerCase() === clean.toLowerCase()
    );
    onChange([...value, canonical ? canonical.name : clean]);
    setQuery("");
    setHighlight(0);
  }

  function removeSkill(name: string) {
    onChange(value.filter((v) => v !== name));
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      if (options.length > 0) {
        addSkill(options[Math.min(highlight, options.length - 1)].name);
      } else if (trimmed) {
        addSkill(trimmed);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setOpen(true);
      setHighlight((h) => Math.min(h + 1, Math.max(options.length - 1, 0)));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setHighlight((h) => Math.max(h - 1, 0));
    } else if (e.key === "," ) {
      // Comma still commits, matching the old habit.
      e.preventDefault();
      if (trimmed) addSkill(trimmed);
    } else if (e.key === "Backspace" && query === "" && value.length > 0) {
      removeSkill(value[value.length - 1]);
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  return (
    <div className="field" ref={containerRef}>
      <label htmlFor={id}>{label}</label>
      <div className="relative">
        <div
          className="flex min-h-[2.6rem] flex-wrap items-center gap-1.5 rounded-lg border border-zinc-200 bg-[#fafafa] px-2 py-1.5 focus-within:border-[#0a0a0a] focus-within:bg-white"
          onClick={() => document.getElementById(id)?.focus()}
        >
          {value.map((name) => (
            <span
              key={name}
              className="inline-flex items-center gap-1 rounded-md bg-zinc-200/70 py-0.5 pl-2 pr-1 text-xs font-medium text-zinc-700"
            >
              {name}
              <button
                type="button"
                aria-label={`Remove ${name}`}
                onClick={(e) => {
                  e.stopPropagation();
                  removeSkill(name);
                }}
                className="flex h-4 w-4 items-center justify-center rounded text-zinc-500 hover:bg-zinc-300 hover:text-zinc-800"
              >
                ×
              </button>
            </span>
          ))}
          <input
            id={id}
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setOpen(true);
              setHighlight(0);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder={value.length === 0 ? "Type to search or add…" : ""}
            className="!m-0 min-w-[8rem] flex-1 !border-0 !bg-transparent !p-0 text-sm focus:!outline-none focus:!ring-0"
            autoComplete="off"
          />
        </div>

        {open && options.length > 0 && (
          <ul className="absolute z-10 mt-1 max-h-56 w-full overflow-auto rounded-lg border border-zinc-200 bg-white py-1 shadow-lg">
            {options.map((opt, i) => (
              <li key={`${opt.kind}-${opt.name}`}>
                <button
                  type="button"
                  onMouseEnter={() => setHighlight(i)}
                  onClick={() => addSkill(opt.name)}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm ${
                    i === highlight ? "bg-zinc-100" : ""
                  }`}
                >
                  {opt.kind === "create" ? (
                    <>
                      <span className="text-zinc-400">Create</span>
                      <span className="rounded bg-zinc-200/70 px-1.5 py-0.5 text-xs font-medium text-zinc-700">
                        {opt.name}
                      </span>
                    </>
                  ) : (
                    <span className="text-zinc-700">{opt.name}</span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
