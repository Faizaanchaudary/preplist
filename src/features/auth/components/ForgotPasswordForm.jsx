import { useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";

export default function ForgotPasswordForm({
  defaultEmail = "",
  isPending = false,
  errorMessage = "",
  onSubmit,
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [touched, setTouched] = useState(false);
  const [localError, setLocalError] = useState("");

  const emailError = useMemo(() => {
    if (!email.trim()) {
      return "Email is required.";
    }

    return "";
  }, [email]);

  const showError = errorMessage || localError;

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);

    if (emailError) {
      setLocalError("Please enter your email address.");
      return;
    }

    setLocalError("");
    await onSubmit?.({ email: email.trim() });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="forgot-password-email"
          className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
        >
          Email
        </label>
        <Input
          id="forgot-password-email"
          name="email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            if (localError) setLocalError("");
          }}
          onBlur={() => setTouched(true)}
          placeholder="Enter your account email"
          autoComplete="email"
          disabled={isPending}
        />
        {touched && emailError ? (
          <p className="mt-2 text-xs text-red-500">{emailError}</p>
        ) : (
          <p className="mt-2 text-xs text-[var(--text-muted)]">
            We will email you a link to choose a new password.
          </p>
        )}
      </div>

      {showError ? (
        <div className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {showError}
        </div>
      ) : null}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Sending..." : "Send reset link"}
      </Button>
    </form>
  );
}
