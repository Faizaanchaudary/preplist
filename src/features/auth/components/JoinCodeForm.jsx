import { useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import useAuthStore from "../../../store/useAuthStore";

function normalizeAccessCode(value) {
  return value.toUpperCase().replace(/\s+/g, "");
}

export default function JoinCodeForm({
  initialEmail = "",
  isPending = false,
  errorMessage = "",
  onSubmit,
}) {
  const currentUser = useAuthStore((state) => state.currentUser);

  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState("");
  const [localError, setLocalError] = useState("");

  const validation = useMemo(() => {
    const normalizedCode = normalizeAccessCode(code.trim());
    const normalizedEmail = (currentUser?.email ?? email).trim();

    return {
      email: normalizedEmail ? "" : "Email is required.",
      code:
        normalizedCode && /^[A-Z0-9]{4,12}$/.test(normalizedCode)
          ? ""
          : "Enter a valid access code (4-12 characters).",
      normalizedEmail,
      normalizedCode,
    };
  }, [code, email, currentUser?.email]);

  const hasErrors = Boolean(validation.email || validation.code);
  const showError = errorMessage || localError;

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (hasErrors || isPending) {
      if (hasErrors) {
        setLocalError("Please enter a valid email and access code.");
      }
      return;
    }

    setLocalError("");

    await onSubmit?.({
      email: currentUser?.email ?? validation.normalizedEmail,
      code: validation.normalizedCode,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!currentUser ? (
        <div className="space-y-1.5">
          <label className="text-sm font-medium text-[var(--text-primary)]">
            Email
          </label>
          <Input
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              if (localError) {
                setLocalError("");
              }
            }}
            placeholder="you@company.com"
            autoComplete="email"
            spellCheck={false}
          />
          {hasSubmitted && validation.email ? (
            <p className="text-sm text-red-600">{validation.email}</p>
          ) : (
            <p className="text-sm text-[var(--text-muted)]">
              Enter the email you want to join with.
            </p>
          )}
        </div>
      ) : (
        <div className="rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] px-4 py-3">
          <p className="text-sm text-[var(--text-muted)]">
            Signed in as{" "}
            <span className="font-medium text-[var(--text-primary)]">
              {currentUser.email}
            </span>
            .
          </p>
        </div>
      )}

      <div className="space-y-1.5">
        <label className="text-sm font-medium text-[var(--text-primary)]">
          Access code
        </label>
        <Input
          value={code}
          onChange={(event) => {
            setCode(normalizeAccessCode(event.target.value));
            if (localError) {
              setLocalError("");
            }
          }}
          placeholder="GRL82P"
          autoComplete="off"
          spellCheck={false}
        />
        {hasSubmitted && validation.code ? (
          <p className="text-sm text-red-600">{validation.code}</p>
        ) : (
          <p className="text-sm text-[var(--text-muted)]">
            Codes are case-insensitive and may expire.
          </p>
        )}
      </div>

      {showError ? (
        <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
          <p className="text-sm text-red-700">{showError}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap items-center justify-end gap-3">
        <Button
          type="submit"
          disabled={isPending}
          className="disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isPending ? "Joining..." : "Join"}
        </Button>
      </div>
    </form>
  );
}