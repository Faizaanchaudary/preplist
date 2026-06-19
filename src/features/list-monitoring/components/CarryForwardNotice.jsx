export default function CarryForwardNotice() {
  return (
    <div className="rounded-[22px] border border-dashed border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4">
      <p className="text-sm leading-6 text-[var(--text-muted)]">
        Daily carry-forward rule: after midnight, the previous day’s exact checklist
        state is preserved in activity snapshots. No new list is generated automatically.
      </p>
    </div>
  );
}