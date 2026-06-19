import { Navigate, useLocation } from "react-router-dom";
import { ROUTES } from "../constants/routes";
import PageLoader from "../ui/PageLoader";
import useAuthStore from "../../store/useAuthStore";

export default function RequireAuth({ children }) {
  const currentUser = useAuthStore((state) => state.currentUser);
  const isHydrated = useAuthStore((state) => state.isHydrated);
  const location = useLocation();

  if (!isHydrated) {
    return <PageLoader />;
  }

  if (!currentUser) {
    return <Navigate to={ROUTES.SPLASH} replace state={{ from: location }} />;
  }

  return children;
}
