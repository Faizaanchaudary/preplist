import { useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import JoinCodeForm from "../components/JoinCodeForm";
import Button from "../../../shared/ui/Button";
import { ROUTES } from "../../../shared/constants/routes";
import useAuthStore from "../../../store/useAuthStore";
import { useJoinByCodeMutation } from "../api/useAuthMutations";

export default function JoinByCodePage() {
  const [result, setResult] = useState(null);
  const [errorMessage, setErrorMessage] = useState("");

  const currentUser = useAuthStore((state) => state.currentUser);
  const activeKitchenId = useAuthStore((state) => state.activeKitchenId);
  const joinByCodeMutation = useJoinByCodeMutation();

  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    location.state?.from?.pathname &&
    typeof location.state.from.pathname === "string"
      ? location.state.from.pathname
      : ROUTES.DASHBOARD;

  if (currentUser && result?.list?.id) {
    return (
      <Navigate to={`${ROUTES.LIST_MONITORING}/${result.list.id}`} replace />
    );
  }

  async function handleSubmit(payload) {
    setErrorMessage("");

    try {
      const data = await joinByCodeMutation.mutateAsync(payload);

      setResult(data ?? null);

      const accessibleKitchenIds = data?.currentUser?.accessibleKitchenIds ?? [];

      if (accessibleKitchenIds.length > 1 && !data?.activeKitchenId) {
        navigate(ROUTES.SELECT_KITCHEN, {
          replace: true,
          state: { from: { pathname: redirectTo } },
        });
      }
    } catch (error) {
      setErrorMessage(
        error?.data?.message || error?.message || "Unable to join with this code."
      );
    }
  }

  return (
    <AuthShell
      title="Join by code"
      description="Validate an access code to join a kitchen/list. Membership and visibility update automatically."
      actions={
        currentUser ? (
          <Link to={redirectTo}>
            <Button variant="secondary">Back to app</Button>
          </Link>
        ) : (
          <Link to={ROUTES.LOGIN} state={location.state}>
            <Button variant="secondary">Sign in</Button>
          </Link>
        )
      }
      footer={
        result ? (
          <div className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Joined{" "}
              <span className="font-semibold">
                {result.list?.title ?? result.kitchen?.name ?? "destination"}
              </span>
              .
            </p>

            <div className="mt-3 flex flex-wrap gap-3">
              {result.list?.id ? (
                <Button
                  onClick={() =>
                    navigate(`${ROUTES.LIST_MONITORING}/${result.list.id}`)
                  }
                  className="px-3 py-2 text-xs"
                >
                  Open list
                </Button>
              ) : (
                <Button
                  onClick={() => navigate(redirectTo)}
                  className="px-3 py-2 text-xs"
                >
                  Continue
                </Button>
              )}

              {currentUser &&
              Array.isArray(currentUser.accessibleKitchenIds) &&
              currentUser.accessibleKitchenIds.length > 1 &&
              !activeKitchenId ? (
                <Link
                  to={ROUTES.SELECT_KITCHEN}
                  state={{ from: { pathname: redirectTo } }}
                >
                  <Button variant="secondary" className="px-3 py-2 text-xs">
                    Select kitchen
                  </Button>
                </Link>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="rounded-[22px] border border-dashed border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4">
            <p className="text-sm leading-6 text-[var(--text-muted)]">
              Successful joins create a membership record, grant list access, and add
              an activity log entry.
            </p>
          </div>
        )
      }
    >
      <JoinCodeForm
        isPending={joinByCodeMutation.isPending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </AuthShell>
  );
}
