import { useState } from "react";
import { Link, Navigate, useLocation } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import ForgotPasswordForm from "../components/ForgotPasswordForm";
import Button from "../../../shared/ui/Button";
import { ROUTES } from "../../../shared/constants/routes";
import useAuthStore from "../../../store/useAuthStore";
import { useForgotPasswordMutation } from "../api/useAuthMutations";

const useMockDataSource = import.meta.env.VITE_DATA_SOURCE !== "firebase";

export default function ForgotPasswordPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const forgotPasswordMutation = useForgotPasswordMutation();

  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const location = useLocation();
  const defaultEmail =
    typeof location.state?.email === "string" ? location.state.email.trim() : "";

  if (currentUser) {
    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  async function handleSubmit(payload) {
    setErrorMessage("");
    setSuccessMessage("");

    try {
      const data = await forgotPasswordMutation.mutateAsync(payload);
      setSuccessMessage(
        data?.message ||
          "If an account exists for this email, a password reset link has been sent."
      );
    } catch (error) {
      setErrorMessage(
        error?.data?.message || error?.message || "Unable to send reset email."
      );
    }
  }

  return (
    <AuthShell
      title="Forgot password"
      description="Enter your staff email and we will send a reset link if the account exists."
      actions={
        <Link to={ROUTES.LOGIN} state={location.state}>
          <Button variant="secondary">Back to sign in</Button>
        </Link>
      }
      footer={
        successMessage ? (
          <div className="rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              {successMessage}
            </p>
            {useMockDataSource ? (
              <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">
                Mock mode is active, so no email is sent. Use password login with
                the demo password instead.
              </p>
            ) : (
              <p className="mt-2 text-xs leading-6 text-[var(--text-muted)]">
                Check your inbox and spam folder. The link expires after a short
                time.
              </p>
            )}
          </div>
        ) : (
          <p className="text-xs text-[var(--text-muted)]">
            Remember your password?{" "}
            <Link
              to={ROUTES.LOGIN}
              state={location.state}
              className="font-medium text-[var(--text-primary)] underline-offset-4 hover:underline"
            >
              Sign in
            </Link>
          </p>
        )
      }
    >
      {successMessage ? null : (
        <ForgotPasswordForm
          defaultEmail={defaultEmail}
          isPending={forgotPasswordMutation.isPending}
          errorMessage={errorMessage}
          onSubmit={handleSubmit}
        />
      )}
    </AuthShell>
  );
}
