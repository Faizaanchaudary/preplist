export const DEMO_LOGIN_PASSWORD = "PrepList123!";

export const DEMO_ROLE_ACCOUNTS = [
  { email: "ahsan@spicehaveli.pk", role: "Super Admin" },
  { email: "founder@spicehaveli.pk", role: "Founder / Owner" },
  { email: "james.siddiqui@spicehaveli.pk", role: "Executive Chef" },
  { email: "fatima.noor@spicehaveli.pk", role: "Head Chef" },
  { email: "omar.raza@spicehaveli.pk", role: "Sous Chef" },
  { email: "zara.ahmed@spicehaveli.pk", role: "Staff" },
];

export default function AuthTestingHelper({
  title = "Demo accounts",
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
        Password for all demo accounts:{" "}
        <span className="font-semibold text-[var(--text-primary)]">
          {DEMO_LOGIN_PASSWORD}
        </span>
      </p>

      <div className="mt-3 space-y-1.5">
        {DEMO_ROLE_ACCOUNTS.map((item) => (
          <div
            key={item.email}
            className="flex flex-col gap-0.5 text-xs text-[var(--text-muted)] sm:flex-row sm:items-center sm:justify-between sm:gap-3"
          >
            <span className="font-medium text-[var(--text-primary)]">
              {item.email}
            </span>
            <span className="shrink-0">{item.role}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
