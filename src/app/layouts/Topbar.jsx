import { useEffect, useMemo, useRef, useState } from "react";
import {
  ChevronDown,
  LogOut,
  PanelLeft,
  ShieldCheck,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Badge from "../../shared/ui/Badge";
import { NAV_ITEMS } from "../../shared/constants/navItems";
import { ROUTES } from "../../shared/constants/routes";
import { formatRoleLabel } from "../../shared/utils/deriveRolePermissions";
import { useLogoutMutation } from "../../features/auth/api/useAuthMutations";
import useAuthStore from "../../store/useAuthStore";
import useSidebarStore from "../../store/useSidebarStore";
import { cn } from "../../shared/utils/cn";

function getPageTitle(pathname) {
  const match = NAV_ITEMS.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );

  if (pathname.startsWith(ROUTES.SUBSCRIPTION)) return "Subscription";
  if (pathname.startsWith(ROUTES.ADMIN_ROLES)) return "Roles";
  if (pathname.startsWith(`${ROUTES.LIST_MONITORING}/templates`)) return "Templates";
  if (pathname.startsWith(ROUTES.JOIN_BY_CODE)) return "Join by code";
  if (pathname.startsWith(ROUTES.RECIPE_BOOK)) return "Recipe book";

  return match?.label ?? "Dashboard";
}

function getInitials(name) {
  if (!name) return "VP";

  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

export default function Topbar() {
  const { pathname } = useLocation();
  const navigate = useNavigate();

  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const openMobileSidebar = useSidebarStore((state) => state.openMobileSidebar);

  const currentUser = useAuthStore((state) => state.currentUser);
  const clearCurrentUser = useAuthStore((state) => state.clearCurrentUser);
  const logoutMutation = useLogoutMutation();

  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const profileRef = useRef(null);

  const initials = useMemo(
    () => getInitials(currentUser?.name),
    [currentUser?.name]
  );

  useEffect(() => {
    function handlePointerDown(event) {
      if (!profileRef.current?.contains(event.target)) {
        setIsProfileOpen(false);
      }
    }

    function handleEscape(event) {
      if (event.key === "Escape") {
        setIsProfileOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  async function handleLogout() {
    if (logoutMutation.isPending) return;

    try {
      await logoutMutation.mutateAsync();
    } catch {
      clearCurrentUser();
    } finally {
      setIsProfileOpen(false);
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }

  return (
    <header className="sticky top-0 z-30 flex h-[76px] items-center justify-between border-b border-[var(--stroke-soft)] bg-[var(--app-bg)]/95 px-4 backdrop-blur-xl sm:h-[84px] sm:px-6 lg:px-8">
      <div className="flex min-w-0 items-center gap-3">
        <button
          type="button"
          onClick={openMobileSidebar}
          className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-[var(--stroke-soft)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-soft)] lg:hidden"
          aria-label="Open navigation"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        <button
          type="button"
          onClick={toggleSidebar}
          className="hidden h-11 w-11 items-center justify-center rounded-[18px] border border-[var(--stroke-soft)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-soft)] lg:inline-flex"
          aria-label="Toggle sidebar"
        >
          <PanelLeft className="h-5 w-5" />
        </button>

        <div className="min-w-0">
          <h1 className="truncate text-lg font-semibold tracking-[-0.02em] text-[var(--text-primary)] sm:text-xl">
            {getPageTitle(pathname)}
          </h1>
          <p className="hidden text-sm text-[var(--text-muted)] sm:block">
            Responsive, role-aware kitchen operations
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Badge variant="dark" className="hidden md:inline-flex">
          <ShieldCheck className="mr-1.5 h-4 w-4" />
          {formatRoleLabel(currentUser?.role)}
        </Badge>

        <div className="relative" ref={profileRef}>
          <button
            type="button"
            onClick={() => setIsProfileOpen((value) => !value)}
            className="flex items-center gap-3 rounded-[18px] border border-[var(--stroke-soft)] bg-white px-3 py-2 shadow-[var(--shadow-card)] transition-colors hover:bg-[var(--surface-soft)]"
            aria-label="Open profile menu"
            aria-expanded={isProfileOpen}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--surface-strong)] text-sm font-semibold text-white">
              {initials}
            </div>

            <div className="hidden min-w-0 text-left sm:block">
              <p className="truncate text-sm font-medium text-[var(--text-primary)]">
                {currentUser?.name ?? "User"}
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                {formatRoleLabel(currentUser?.role)}
              </p>
            </div>

            <ChevronDown
              className={cn(
                "h-4 w-4 text-[var(--text-muted)] transition-transform duration-200",
                isProfileOpen ? "rotate-180" : ""
              )}
            />
          </button>

          {isProfileOpen ? (
            <div className="absolute right-0 top-[calc(100%+12px)] z-50 w-[280px] rounded-[22px] border border-[var(--stroke-soft)] bg-white p-3 shadow-[0_18px_50px_rgba(15,23,42,0.12)]">
              <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
                <div className="flex items-start gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-strong)] text-sm font-semibold text-white">
                    {initials}
                  </div>

                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                      {currentUser?.name ?? "User"}
                    </p>
                    <p className="mt-1 text-sm text-[var(--text-muted)]">
                      {formatRoleLabel(currentUser?.role)}
                    </p>
                    <p className="mt-1 truncate text-xs text-[var(--text-muted)]">
                      {currentUser?.email ?? "—"}
                    </p>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={handleLogout}
                disabled={logoutMutation.isPending}
                className="mt-3 flex w-full items-center gap-3 rounded-[16px] px-3 py-3 text-left text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-60"
              >
                <LogOut className="h-4 w-4" />
                {logoutMutation.isPending ? "Signing out..." : "Logout"}
              </button>
            </div>
          ) : null}
        </div>
      </div>
    </header>
  );
}
