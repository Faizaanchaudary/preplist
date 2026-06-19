import { useMemo, useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import AuthTestingHelper from "./AuthTestingHelper";

export default function LoginForm({
  defaultEmail = "",
  isPending = false,
  errorMessage = "",
  onSubmit,
  onJoinByCode,
  onForgotPassword,
}) {
  const [formValues, setFormValues] = useState({
    email: defaultEmail,
    password: "",
  });
  const [touched, setTouched] = useState({
    email: false,
    password: false,
  });
  const [localError, setLocalError] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const errors = useMemo(() => {
    const nextErrors = {};

    if (!formValues.email.trim()) {
      nextErrors.email = "Email is required.";
    }

    if (!formValues.password.trim()) {
      nextErrors.password = "Password is required.";
    }

    return nextErrors;
  }, [formValues.email, formValues.password]);

  const hasErrors = Object.keys(errors).length > 0;
  const showError = errorMessage || localError;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (localError) {
      setLocalError("");
    }
  }

  function handleBlur(event) {
    const { name } = event.target;

    setTouched((previous) => ({
      ...previous,
      [name]: true,
    }));
  }

  async function handleSubmit(event) {
    event.preventDefault();

    const nextTouched = {
      email: true,
      password: true,
    };

    setTouched(nextTouched);

    if (hasErrors) {
      setLocalError("Please complete the required fields.");
      return;
    }

    setLocalError("");

    await onSubmit?.({
      email: formValues.email.trim(),
      password: formValues.password,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label
          htmlFor="login-email"
          className="mb-2 block text-sm font-medium text-[var(--text-primary)]"
        >
          Email
        </label>

        <Input
          id="login-email"
          name="email"
          type="email"
          value={formValues.email}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your email"
          autoComplete="email"
        />

        {touched.email && errors.email ? (
          <p className="mt-2 text-xs text-red-500">{errors.email}</p>
        ) : null}
      </div>

      <div>
        <div className="mb-2 flex items-center justify-between gap-3">
          <label
            htmlFor="login-password"
            className="block text-sm font-medium text-[var(--text-primary)]"
          >
            Password
          </label>

          {typeof onForgotPassword === "function" ? (
            <button
              type="button"
              onClick={onForgotPassword}
              className="text-xs font-medium text-[var(--text-muted)] underline-offset-4 transition hover:text-[var(--text-primary)] hover:underline sm:text-sm"
            >
              Forgot password?
            </button>
          ) : null}
        </div>

        <Input
          id="login-password"
          name="password"
          type={showPassword ? "text" : "password"}
          value={formValues.password}
          onChange={handleChange}
          onBlur={handleBlur}
          placeholder="Enter your password"
          autoComplete="current-password"
          rightSlot={
            <button
              type="button"
              onClick={() => setShowPassword((value) => !value)}
              className="inline-flex h-8 w-8 items-center justify-center rounded-full text-[var(--text-muted)] transition-colors hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        {touched.password && errors.password ? (
          <p className="mt-2 text-xs text-red-500">{errors.password}</p>
        ) : null}
      </div>

      {showError ? (
        <div className="rounded-[16px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
          {showError}
        </div>
      ) : null}

      {typeof onJoinByCode === "function" ? (
        <div className="flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onJoinByCode}
            className="text-sm font-medium text-[var(--text-primary)] underline-offset-4 transition hover:underline"
          >
            Join by code
          </button>
        </div>
      ) : null}

      <AuthTestingHelper className="mt-2" />

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? "Signing in..." : "Sign in"}
      </Button>
    </form>
  );
}