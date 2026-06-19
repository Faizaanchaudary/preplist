const TEST_ROLE_EMAILS = [
  { email: "super@demo.com", role: "Super Admin (shows Admin sidebar)" },
  { email: "admin@demo.com", role: "Super Admin (shows Admin sidebar)" },
  { email: "founder@demo.com", role: "Founder/Owner (data-only)" },
  { email: "exec@demo.com", role: "Executive Chef" },
  { email: "head@demo.com", role: "Head Chef" },
  { email: "sous@demo.com", role: "Sous Chef" },
  { email: "staff@demo.com", role: "Staff/User" },
];

export default function AuthTestingHelper({
  title = "Testing access",
  className = "",
}) {
  return (
    <div
      className={`rounded-[18px] border border-dashed border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4 ${className}`}
    >
      <p className="text-sm font-semibold text-[var(--text-primary)]">
        {title}
      </p>

      <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">
        For testing, any non-empty email and any PIN will work.
      </p>

      <div className="mt-3 space-y-1.5">
        {TEST_ROLE_EMAILS.map((item) => (
          <div
            key={item.email}
            className="flex flex-col gap-0.5 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between"
          >
            <span className="font-medium text-[var(--text-primary)]">
              {item.email}
            </span>
            <span>{item.role}</span>
          </div>
        ))}
      </div>

      <p className="mt-3 text-xs leading-6 text-[var(--text-muted)]">
        Any other email will sign in as{" "}
        <span className="font-medium text-[var(--text-primary)]">
          Staff/User
        </span>
        .
      </p>
    </div>
  );
}
