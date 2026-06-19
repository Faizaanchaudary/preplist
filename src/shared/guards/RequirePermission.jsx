import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import PageLoader from "../ui/PageLoader";
import useAuthStore from "../../store/useAuthStore";

export default function RequirePermission({
  permission,
  permissions,
  match = "all",
  children,
}) {
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const currentUser = useAuthStore((state) => state.currentUser);
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const location = useLocation();

  if (!isHydrated) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  const required = permission
    ? [permission]
    : Array.isArray(permissions)
      ? permissions
      : [];

  const shouldAllow = required.length
    ? match === "any"
      ? required.some((perm) => hasPermission(perm))
      : required.every((perm) => hasPermission(perm))
    : true;

  if (!shouldAllow) {
    return <Navigate to={ROUTES.DASHBOARD} replace state={{ from: location }} />;
  }

  return children;
}
