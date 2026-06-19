import { useMemo, useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import PageTransition from "../../../app/layouts/PageTransition";
import PinLoginForm from "../components/PinLoginForm";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import { ROUTES } from "../../../shared/constants/routes";
import useAuthStore from "../../../store/useAuthStore";
import { usePinLoginMutation } from "../api/useAuthMutations";

const LAST_LOGIN_EMAIL_STORAGE_KEY = "vpl_last_login_email";

function rememberLoginEmail(email) {
  if (typeof window === "undefined") return;

  const normalizedEmail = String(email ?? "").trim();
  if (!normalizedEmail) return;

  try {
    window.localStorage.setItem(LAST_LOGIN_EMAIL_STORAGE_KEY, normalizedEmail);
  } catch {
    // Ignore storage failures.
  }
}

function resolveInitialPinEmail(location) {
  const stateEmail =
    typeof location.state?.email === "string" ? location.state.email.trim() : "";
  return stateEmail;
}

export default function PinLoginPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const pinLoginMutation = usePinLoginMutation();

  const navigate = useNavigate();
  const location = useLocation();

  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState(() => resolveInitialPinEmail(location));
  const [emailTouched, setEmailTouched] = useState(false);

  const emailError = useMemo(() => {
    if (!email.trim()) {
      return "Email is required.";
    }

    return "";
  }, [email]);

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

  function resolvePinLoginEmail() {
    return email.trim();
  }

  function handleBack() {
    const historyIndex = window.history.state?.idx;

    if (typeof historyIndex === "number" && historyIndex > 0) {
      navigate(-1);
      return;
    }

    navigate(ROUTES.LOGIN, { replace: true, state: location.state });
  }

  async function handleSubmit(payload) {
    setErrorMessage("");
    setEmailTouched(true);

    const normalizedEmail = resolvePinLoginEmail();

    if (!normalizedEmail) {
      return;
    }

    try {
      const data = await pinLoginMutation.mutateAsync({
        email: normalizedEmail,
        pin: payload?.pin,
      });

      rememberLoginEmail(normalizedEmail);

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
        error?.data?.message || error?.message || "Unable to sign in with PIN."
      );
    }
  }

  return (
    <PageTransition>
      <main className="min-h-screen bg-[#f8f8f7] px-5 py-6 sm:flex sm:items-center sm:justify-center sm:px-6">
        <section className="mx-auto flex min-h-[calc(100dvh-3rem)] w-full max-w-[480px] flex-col rounded-none bg-[#f8f8f7] sm:min-h-[760px] sm:rounded-[34px] sm:border sm:border-[var(--stroke-soft)] sm:bg-white sm:p-6 sm:shadow-[var(--shadow-card)]">
          <div className="mb-10 flex items-center justify-between gap-4">
            <button
              type="button"
              onClick={handleBack}
              aria-label="Go back"
              className="inline-flex h-14 w-14 items-center justify-center rounded-full border border-[var(--stroke-soft)] bg-white text-[var(--text-primary)] shadow-sm transition hover:bg-[var(--surface-soft)]"
            >
              <ArrowLeft className="h-6 w-6" />
            </button>

            <Button
              type="button"
              variant="secondary"
              onClick={() =>
                navigate(ROUTES.LOGIN, {
                  state: location.state,
                })
              }
              className="min-h-[54px] rounded-full px-6 text-base"
            >
              Use Password
            </Button>
          </div>

          <div className="mb-6 space-y-1.5">
            <label
              htmlFor="pin-login-email"
              className="text-sm font-medium text-[var(--text-primary)]"
            >
              Email
            </label>
            <Input
              id="pin-login-email"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              onBlur={() => setEmailTouched(true)}
              placeholder="Enter your staff email"
              autoComplete="email"
              disabled={pinLoginMutation.isPending}
            />
            {emailTouched && emailError ? (
              <p className="text-sm text-red-600">{emailError}</p>
            ) : (
              <p className="text-xs text-[var(--text-muted)]">
                Use the same email saved on your staff account.
              </p>
            )}
          </div>

          <PinLoginForm
            isPending={pinLoginMutation.isPending}
            errorMessage={errorMessage}
            onSubmit={handleSubmit}
            onForgotPassword={() => {
              window.alert("Forgot Password? Contact Admin");
            }}
          />
        </section>
      </main>
    </PageTransition>
  );
}
