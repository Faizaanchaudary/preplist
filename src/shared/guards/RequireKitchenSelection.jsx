import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import PageLoader from "../ui/PageLoader";
import useAuthStore from "../../store/useAuthStore";

export default function RequireKitchenSelection({ children }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const activeKitchenId = useAuthStore((state) => state.activeKitchenId);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const location = useLocation();

  if (!isHydrated) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return children;
  }

  const accessibleKitchenIds = Array.isArray(currentUser.accessibleKitchenIds)
    ? currentUser.accessibleKitchenIds
    : [];

  if (accessibleKitchenIds.length > 1 && !activeKitchenId) {
    return (
      <Navigate to={ROUTES.SELECT_KITCHEN} replace state={{ from: location }} />
    );
  }

  return children;
}

