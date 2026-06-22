export function SourceBadge({
  source,
  subtle = false,
}: {
  source: "resume" | "manual";
  subtle?: boolean;
}) {
  return (
    <span
      className={`badge ${source === "resume" ? "badge-resume" : "badge-manual"}${
        subtle ? " badge-sm" : ""
      }`}
    >
      {source}
    </span>
  );
}