import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  LogOut,
  X,
} from "lucide-react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { NAV_ITEMS } from "../../shared/constants/navItems";
import { ROUTES } from "../../shared/constants/routes";
import { cn } from "../../shared/utils/cn";
import { filterNavItemsForUser, getUserPermissions } from "../../shared/utils/rbac";
import { formatRoleLabel } from "../../shared/utils/deriveRolePermissions";
import { useLogoutMutation } from "../../features/auth/api/useAuthMutations";
import useAuthStore from "../../store/useAuthStore";
import useSidebarStore from "../../store/useSidebarStore";
import { PERMISSIONS } from "../../shared/constants/permissions";

function getInitials(name) {
  if (!name) return "VP";

  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.slice(0, 2).map((part) => part[0]).join("").toUpperCase();
}

function SidebarLinks({ items, isExpanded, onNavigate }) {
  return (
    <div className="space-y-2">
      {items.map(({ key, label, href, icon: Icon }) => (
        <NavLink
          key={key}
          to={href}
          onClick={onNavigate}
          className={({ isActive }) =>
            cn(
              "group flex items-center rounded-[20px] px-3 py-3 text-sm font-medium transition-all duration-200",
              isExpanded ? "justify-start gap-3" : "justify-center",
              isActive
                ? "bg-[var(--surface-soft)] text-[var(--text-primary)] shadow-[inset_0_0_0_1px_var(--stroke-soft)]"
                : "text-[var(--text-muted)] hover:bg-[var(--surface-soft)] hover:text-[var(--text-primary)]"
            )
          }
        >
          <Icon className="h-5 w-5 shrink-0" />

          <AnimatePresence initial={false}>
            {isExpanded ? (
              <motion.span
                key={`${key}-label`}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -6 }}
                className="truncate"
              >
                {label}
              </motion.span>
            ) : null}
          </AnimatePresence>
        </NavLink>
      ))}
    </div>
  );
}

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();

  const isExpanded = useSidebarStore((state) => state.isExpanded);
  const isMobileOpen = useSidebarStore((state) => state.isMobileOpen);
  const toggleSidebar = useSidebarStore((state) => state.toggleSidebar);
  const closeMobileSidebar = useSidebarStore((state) => state.closeMobileSidebar);

  const currentUser = useAuthStore((state) => state.currentUser);
  const clearCurrentUser = useAuthStore((state) => state.clearCurrentUser);
  const logoutMutation = useLogoutMutation();

  const visibleNavItems = useMemo(
    () => {
      const items = filterNavItemsForUser(currentUser, NAV_ITEMS);
      const permissions = getUserPermissions(currentUser);

      const ownOnly =
        permissions.includes(PERMISSIONS.VIEW_OWN_ACTIVITY) &&
        !permissions.includes(PERMISSIONS.VIEW_ACTIVITY_LOGS);

      if (!ownOnly) return items;

      return items.map((item) =>
        item.key === "activity-logs" ? { ...item, label: "My Activity" } : item
      );
    },
    [currentUser]
  );

  const initials = useMemo(
    () => getInitials(currentUser?.name),
    [currentUser?.name]
  );

  useEffect(() => {
    closeMobileSidebar();
  }, [location.pathname, closeMobileSidebar]);

  async function handleLogout() {
    if (logoutMutation.isPending) return;

    try {
      await logoutMutation.mutateAsync();
    } catch {
      clearCurrentUser();
    } finally {
      closeMobileSidebar();
      navigate(ROUTES.LOGIN, { replace: true });
    }
  }

  return (
    <>
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 hidden flex-col border-r border-[var(--stroke-soft)] bg-white/95 backdrop-blur-xl transition-[width] duration-300 ease-out lg:flex",
          isExpanded ? "w-[248px]" : "w-[88px]"
        )}
      >
        <div
          className={cn(
            "flex h-[84px] items-center border-b border-[var(--stroke-soft)] px-4",
            isExpanded ? "justify-between" : "justify-center"
          )}
        >
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[var(--surface-strong)] text-sm font-semibold text-white shadow-[var(--shadow-card)]">
              VP
            </div>

            <AnimatePresence initial={false}>
              {isExpanded ? (
                <motion.div
                  key="brand"
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -8 }}
                  className="min-w-0"
                >
                  <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                    Vincent Prep
                  </p>
                  <p className="truncate text-xs text-[var(--text-muted)]">
                    Operations Suite
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          {isExpanded ? (
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-[var(--stroke-soft)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-soft)]"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={toggleSidebar}
              className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-[var(--stroke-soft)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-soft)]"
              aria-label="Expand sidebar"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
          )}
        </div>

        <nav className="flex-1 px-3 py-4">
          {visibleNavItems.length ? (
            <SidebarLinks items={visibleNavItems} isExpanded={isExpanded} />
          ) : (
            <div className="rounded-[20px] border border-dashed border-[var(--stroke-soft)] bg-[var(--surface-soft)] px-4 py-5 text-center">
              {isExpanded ? (
                <p className="text-sm text-[var(--text-muted)]">
                  No navigation items are available for this role.
                </p>
              ) : null}
            </div>
          )}
        </nav>
      </aside>

      <div
        className={cn(
          "fixed inset-0 z-50 bg-slate-950/30 transition-opacity duration-200 lg:hidden",
          isMobileOpen ? "pointer-events-auto opacity-100" : "pointer-events-none opacity-0"
        )}
        onClick={closeMobileSidebar}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-[60] flex w-[280px] flex-col border-r border-[var(--stroke-soft)] bg-white transition-transform duration-300 ease-out lg:hidden",
          isMobileOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        <div className="flex h-[76px] items-center justify-between border-b border-[var(--stroke-soft)] px-4">
          <div className="flex min-w-0 items-center gap-3 overflow-hidden">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[18px] bg-[var(--surface-strong)] text-sm font-semibold text-white shadow-[var(--shadow-card)]">
              VP
            </div>

            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                Vincent Prep
              </p>
              <p className="truncate text-xs text-[var(--text-muted)]">
                Operations Suite
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={closeMobileSidebar}
            className="inline-flex h-10 w-10 items-center justify-center rounded-[16px] border border-[var(--stroke-soft)] bg-white text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-soft)]"
            aria-label="Close navigation"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-3 py-4">
          {visibleNavItems.length ? (
            <SidebarLinks
              items={visibleNavItems}
              isExpanded
              onNavigate={closeMobileSidebar}
            />
          ) : (
            <div className="rounded-[20px] border border-dashed border-[var(--stroke-soft)] bg-[var(--surface-soft)] px-4 py-5 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                No navigation items are available for this role.
              </p>
            </div>
          )}
        </nav>

        <div className="border-t border-[var(--stroke-soft)] p-4">
          <div className="rounded-[20px] bg-[var(--surface-soft)] p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--surface-strong)] text-sm font-semibold text-white">
                {initials}
              </div>

              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-[var(--text-primary)]">
                  {currentUser?.name ?? "User"}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {formatRoleLabel(currentUser?.role)}
                </p>
                <p className="truncate text-xs text-[var(--text-muted)]">
                  {currentUser?.email ?? "—"}
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={handleLogout}
              disabled={logoutMutation.isPending}
              className="mt-4 flex w-full items-center justify-center gap-2 rounded-[16px] border border-[var(--stroke-soft)] bg-white px-4 py-3 text-sm font-medium text-[var(--text-primary)] transition-colors hover:bg-[var(--surface-soft)] disabled:cursor-not-allowed disabled:opacity-60"
            >
              <LogOut className="h-4 w-4" />
              {logoutMutation.isPending ? "Signing out..." : "Logout"}
            </button>
          </div>
        </div>
      </aside>
    </>
  );
}
