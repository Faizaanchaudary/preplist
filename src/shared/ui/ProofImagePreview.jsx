import Card from "./Card";

export default function ProofImagePreview({
  url,
  label,
  emptyTitle = "No image",
  emptyDescription = "Select an image to preview it here.",
  className = "",
}) {
  return (
    <Card className={`overflow-hidden border-dashed ${className}`.trim()}>
      {url ? (
        <div className="bg-[var(--surface-soft)]">
          <img
            src={url}
            alt={label || "Completion proof"}
            className="mx-auto max-h-[320px] w-full object-contain"
          />
        </div>
      ) : (
        <div className="flex h-[220px] items-center justify-center bg-[var(--surface-soft)] p-6 text-center">
          <div>
            <p className="text-base font-semibold text-[var(--text-primary)]">
              {emptyTitle}
            </p>
            <p className="mt-2 text-sm leading-6 text-[var(--text-muted)]">
              {emptyDescription}
            </p>
          </div>
        </div>
      )}
    </Card>
  );
}
