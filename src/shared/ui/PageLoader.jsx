export default function PageLoader() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[var(--app-bg)] px-4">
      <div className="flex items-center gap-3 rounded-full border border-[var(--stroke-soft)] bg-white px-5 py-3 shadow-[var(--shadow-card)]">
        <span className="h-5 w-5 animate-spin rounded-full border-2 border-[var(--surface-strong)] border-t-transparent" />
        <span className="text-sm font-medium text-[var(--text-primary)]">
          Loading...
        </span>
      </div>
    </div>
  );
}