export function SourceBadge({ source }: { source: "resume" | "manual" }) {
  return (
    <span
      className={`badge ${source === "resume" ? "badge-resume" : "badge-manual"}`}
    >
      {source}
    </span>
  );
}
