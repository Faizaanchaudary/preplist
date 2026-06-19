import Badge from "../../../shared/ui/Badge";

export default function ListHeader({ title, section, accessCode, active }) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="text-lg font-semibold text-[var(--text-primary)]">
          {title}
        </h3>
        <p className="mt-1 text-sm text-[var(--text-muted)]">
          {section}
          {accessCode ? ` · Code ${accessCode}` : ""}
        </p>
      </div>

      <Badge variant={active ? "success" : "neutral"}>
        {active ? "Active" : "Archived"}
      </Badge>
    </div>
  );
}