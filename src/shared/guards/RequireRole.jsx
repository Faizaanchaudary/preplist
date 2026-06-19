import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import PageLoader from "../ui/PageLoader";
import useAuthStore from "../../store/useAuthStore";

export default function RequireRole({ allowedRoles = [], children }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const location = useLocation();

  const safeAllowedRoles = Array.isArray(allowedRoles) ? allowedRoles : [];

  if (!isHydrated) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.LOGIN} replace state={{ from: location }} />;
  }

  if (safeAllowedRoles.length && !safeAllowedRoles.includes(currentUser.role)) {
    return <Navigate to={ROUTES.DASHBOARD} replace state={{ from: location }} />;
  }

  return children;
}