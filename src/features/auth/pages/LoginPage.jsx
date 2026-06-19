import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import Button from "../../../shared/ui/Button";
import { ROUTES } from "../../../shared/constants/routes";
import useAuthStore from "../../../store/useAuthStore";
import AuthShell from "../components/AuthShell";
import LoginForm from "../components/LoginForm";
import { useLoginMutation } from "../api/useAuthMutations";

const LAST_LOGIN_EMAIL_STORAGE_KEY = "vpl_last_login_email";

function rememberLoginEmail(email) {
  if (typeof window === "undefined") return;

  const normalizedEmail = String(email ?? "").trim();
  if (!normalizedEmail) return;

  try {
    window.localStorage.setItem(LAST_LOGIN_EMAIL_STORAGE_KEY, normalizedEmail);
  } catch {
    // Ignore storage failures so mock login stays usable in restricted browsers.
  }
}

export default function LoginPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const loginMutation = useLoginMutation();

  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    location.state?.from?.pathname &&
    typeof location.state.from.pathname === "string"
      ? location.state.from.pathname
      : ROUTES.DASHBOARD;

  if (currentUser) {
    const accessibleKitchenIds = currentUser?.accessibleKitchenIds ?? [];

    if (accessibleKitchenIds.length > 1 && !useAuthStore.getState().activeKitchenId) {
      return <Navigate to={ROUTES.SELECT_KITCHEN} replace />;
    }

    return <Navigate to={ROUTES.DASHBOARD} replace />;
  }

  async function handleSubmit(payload) {
    setErrorMessage("");

    try {
      rememberLoginEmail(payload?.email);
      const data = await loginMutation.mutateAsync(payload);

      const accessibleKitchenIds = data?.currentUser?.accessibleKitchenIds ?? [];

      if (accessibleKitchenIds.length > 1 && !data?.activeKitchenId) {
        navigate(ROUTES.SELECT_KITCHEN, {
          replace: true,
          state: { from: { pathname: redirectTo } },
        });
        return;
      }

      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(
        error?.data?.message || error?.message || "Unable to sign in."
      );
    }
  }

  return (
    <AuthShell
      title="Sign in"
      description="Sign in with your staff email and password."
      actions={
        <Link to={ROUTES.PIN_LOGIN} state={location.state}>
          <Button variant="secondary">Use PIN</Button>
        </Link>
      }
      footer={
        <p className="text-xs text-[var(--text-muted)]">
          Use a demo account below or your assigned staff email.
        </p>
      }
    >
      <LoginForm
        isPending={loginMutation.isPending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
        onJoinByCode={() =>
          navigate(ROUTES.JOIN_BY_CODE, {
            state: location.state,
          })
        }
        onForgotPassword={() =>
          navigate(ROUTES.FORGOT_PASSWORD, {
            state: location.state,
          })
        }
      />
    </AuthShell>
  );
}
