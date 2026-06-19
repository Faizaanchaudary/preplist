import { useEffect } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import Button from "../../../shared/ui/Button";
import { ROUTES } from "../../../shared/constants/routes";
import useAuthStore from "../../../store/useAuthStore";

export default function SplashPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const activeKitchenId = useAuthStore((state) => state.activeKitchenId);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    location.state?.from?.pathname && typeof location.state.from.pathname === "string"
      ? location.state.from.pathname
      : ROUTES.DASHBOARD;

  const accessibleKitchenCount = Array.isArray(currentUser?.accessibleKitchenIds)
    ? currentUser.accessibleKitchenIds.length
    : 0;

  useEffect(() => {
    if (!isHydrated) return;
    if (currentUser) return;

    const timer = window.setTimeout(() => {
      navigate(ROUTES.LOGIN, { replace: true, state: { from: { pathname: redirectTo } } });
    }, 800);

    return () => window.clearTimeout(timer);
  }, [currentUser, isHydrated, navigate, redirectTo]);

  if (!isHydrated) {
    return null;
  }

  if (currentUser) {
    if (accessibleKitchenCount > 1 && !activeKitchenId) {
      return <Navigate to={ROUTES.SELECT_KITCHEN} replace state={{ from: { pathname: redirectTo } }} />;
    }

    return <Navigate to={redirectTo} replace />;
  }

  return (
    <AuthShell
      title="Preplist"
      description="Operational checklists, mock-first and production-ready."
      footer={
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link to={ROUTES.LOGIN} state={{ from: { pathname: redirectTo } }}>
            <Button>Continue</Button>
          </Link>
          <Link to={ROUTES.JOIN_BY_CODE} state={{ from: { pathname: redirectTo } }}>
            <Button variant="ghost">Join by code</Button>
          </Link>
        </div>
      }
    >
      <div className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4">
        <p className="text-sm leading-6 text-[var(--text-muted)]">
          Redirecting to sign-in…
        </p>
      </div>
    </AuthShell>
  );
}

