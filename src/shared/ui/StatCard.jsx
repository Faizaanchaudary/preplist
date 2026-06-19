import Card from "./Card";

export default function StatCard({ label, value, helper }) {
  return (
    <Card className="p-5">
      <p className="text-sm text-[var(--text-muted)]">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-[-0.03em] text-[var(--text-primary)]">
        {value}
      </p>
      <p className="mt-2 text-sm text-[var(--text-muted)]">{helper}</p>
    </Card>
  );
}