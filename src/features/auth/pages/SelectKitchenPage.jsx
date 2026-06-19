import { useState } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";
import AuthShell from "../components/AuthShell";
import KitchenSelectForm from "../components/KitchenSelectForm";
import Button from "../../../shared/ui/Button";
import PageLoader from "../../../shared/ui/PageLoader";
import ErrorState from "../../../shared/ui/ErrorState";
import { ROUTES } from "../../../shared/constants/routes";
import useAuthStore from "../../../store/useAuthStore";
import { useAuthMeQuery } from "../api/useAuthQuery";
import { useLogoutMutation, useSelectKitchenMutation } from "../api/useAuthMutations";

export default function SelectKitchenPage() {
  const currentUser = useAuthStore((state) => state.currentUser);
  const activeKitchenId = useAuthStore((state) => state.activeKitchenId);
  const setCurrentUser = useAuthStore((state) => state.setCurrentUser);
  const setActiveKitchenId = useAuthStore((state) => state.setActiveKitchenId);

  const authMeQuery = useAuthMeQuery();
  const logoutMutation = useLogoutMutation();
  const selectKitchenMutation = useSelectKitchenMutation();

  const [errorMessage, setErrorMessage] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  const redirectTo =
    location.state?.from?.pathname &&
    typeof location.state.from.pathname === "string"
      ? location.state.from.pathname
      : ROUTES.DASHBOARD;

  const accessibleKitchenCount = Array.isArray(currentUser?.accessibleKitchenIds)
    ? currentUser.accessibleKitchenIds.length
    : 0;

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (accessibleKitchenCount <= 1 || activeKitchenId) {
    return <Navigate to={redirectTo} replace />;
  }

  if (authMeQuery.isLoading) {
    return <PageLoader />;
  }

  if (authMeQuery.isError) {
    return (
      <AuthShell
        title="Select a kitchen"
        description="Choose the kitchen you want to work in. You can change this later."
      >
        <ErrorState
          title="Unable to load kitchens"
          error={authMeQuery.error}
        />
      </AuthShell>
    );
  }

  const kitchens = Array.isArray(authMeQuery.data?.accessibleKitchens)
    ? authMeQuery.data.accessibleKitchens
    : [];

  async function handleSubmit(payload) {
    setErrorMessage("");

    try {
      const data = await selectKitchenMutation.mutateAsync(payload);

      if (data?.currentUser) {
        setCurrentUser(data.currentUser);
      }

      setActiveKitchenId(data?.activeKitchenId ?? payload.kitchenId);
      navigate(redirectTo, { replace: true });
    } catch (error) {
      setErrorMessage(
        error?.data?.message || error?.message || "Unable to select kitchen."
      );
    }
  }

  return (
    <AuthShell
      title="Select a kitchen"
      description="Choose the kitchen you want to work in. You can change this later."
      actions={
        <Button
          variant="secondary"
          disabled={logoutMutation.isPending}
          className="disabled:cursor-not-allowed disabled:opacity-60"
          onClick={async () => {
            try {
              await logoutMutation.mutateAsync();
              navigate(ROUTES.LOGIN, { replace: true });
            } catch {
              // Logout mutation error can stay silent here.
            }
          }}
        >
          {logoutMutation.isPending ? "Signing out..." : "Sign out"}
        </Button>
      }
    >
      <KitchenSelectForm
        kitchens={kitchens}
        isPending={selectKitchenMutation.isPending}
        errorMessage={errorMessage}
        onSubmit={handleSubmit}
      />
    </AuthShell>
  );
}