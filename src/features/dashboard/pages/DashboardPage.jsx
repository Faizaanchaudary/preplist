import { Link } from "react-router-dom";
import Card from "../../../shared/ui/Card";
import Button from "../../../shared/ui/Button";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import StatCard from "../../../shared/ui/StatCard";
import Badge from "../../../shared/ui/Badge";
import PageLoader from "../../../shared/ui/PageLoader";
import ErrorState from "../../../shared/ui/ErrorState";
import EmptyState from "../../../shared/ui/EmptyState";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";
import { ROUTES } from "../../../shared/constants/routes";
import { ROLES } from "../../../shared/constants/roles";
import { useDashboardQuery } from "../api/useDashboardQuery";

export default function DashboardPage() {
  const { data, isLoading, isError, error } = useDashboardQuery();

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <FeaturePageShell
        title="Dashboard"
        description="Live kitchen visibility, role-aware scope, and quick insight into lists, members, and completion progress."
      >
        <ErrorState title="Unable to load dashboard" error={error} />
      </FeaturePageShell>
    );
  }

  if (!data) {
    return (
      <FeaturePageShell
        title="Dashboard"
        description="Live kitchen visibility, role-aware scope, and quick insight into lists, members, and completion progress."
      >
        <ErrorState
          title="Dashboard unavailable"
          description="Dashboard data was not returned by the server."
        />
      </FeaturePageShell>
    );
  }

  const currentUser = data.currentUser ?? null;
  const stats = Array.isArray(data.stats) ? data.stats : [];
  const accessibleKitchenIds = Array.isArray(currentUser?.accessibleKitchenIds)
    ? currentUser.accessibleKitchenIds
    : [];
  const invitedListIds = Array.isArray(currentUser?.invitedListIds)
    ? currentUser.invitedListIds
    : [];

  const shouldShowJoinCta =
    currentUser?.role === ROLES.STAFF &&
    accessibleKitchenIds.length === 0 &&
    invitedListIds.length === 0;

  if (shouldShowJoinCta) {
    return (
      <FeaturePageShell
        title="Dashboard"
        description="Live kitchen visibility, role-aware scope, and quick insight into lists, members, and completion progress."
      >
        <EmptyState
          title="You are not part of a kitchen yet"
          description="Join with an access code to see kitchens, prep lists, recipes, and activity assigned to you."
        >
          <Link to={ROUTES.JOIN_BY_CODE}>
            <Button>Join with access code</Button>
          </Link>
        </EmptyState>
      </FeaturePageShell>
    );
  }

  const kitchens = Array.isArray(data.kitchens) ? data.kitchens : [];
  const fastestKitchen = data.fastestKitchen ?? null;
  const activeStaff = Array.isArray(data.activeStaff) ? data.activeStaff : [];
  const recentActivity = Array.isArray(data.recentActivity)
    ? data.recentActivity
    : [];

  const isExecutive = [
    ROLES.SUPER_ADMIN,
    ROLES.FOUNDER,
    ROLES.EXECUTIVE_CHEF,
  ].includes(currentUser?.role);

  // super_admin never sees the raw activity feed (it names actual recipes
  // and prep-list tasks) — hide the section entirely rather than show it
  // empty.
  const isSuperAdmin = currentUser?.role === ROLES.SUPER_ADMIN;

  // Keep displayedStats to just the original stats array so it stays exactly 4 cards
  const displayedStats = [...stats];

  return (
    <FeaturePageShell
      title="Dashboard"
      description="Live kitchen visibility, role-aware scope, and quick insight into lists, members, and completion progress."
    >
      {displayedStats.length ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {displayedStats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="No dashboard stats"
          description="Dashboard stats are not available right now."
        />
      )}

      <div
        className={
          isSuperAdmin ? "grid gap-5" : "grid gap-5 xl:grid-cols-[1.1fr_0.9fr]"
        }
      >
        <Card className="p-5 sm:p-6">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                Live kitchen overview
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                Visible kitchens filtered by current role access.
              </p>
            </div>
            <Badge>{kitchens.length} kitchens</Badge>
          </div>

          {isExecutive && fastestKitchen ? (
            <div className="mt-4 rounded-[18px] border border-blue-100 bg-blue-50/50 p-4 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-wider text-blue-700">Operational Leader</p>
                <p className="mt-0.5 text-sm font-bold text-blue-900">{fastestKitchen.name}</p>
              </div>
              <div className="text-right">
                <p className="text-[11px] font-semibold text-blue-700">Avg completion time</p>
                <p className="text-sm font-bold text-blue-900">{fastestKitchen.avgTime}</p>
              </div>
            </div>
          ) : null}

          <div className="mt-5">
            {kitchens.length ? (
              <div className="grid gap-4">
                {kitchens.map((kitchen) => (
                  <div
                    key={kitchen.id}
                    className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="text-base font-semibold text-[var(--text-primary)]">
                          {kitchen.name}
                        </p>
                        <p className="text-sm text-[var(--text-muted)]">
                          {kitchen.city} · {kitchen.siteCode}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {isExecutive ? (
                          <span className="text-xs text-[var(--text-muted)] font-medium">
                            Avg: {kitchen.averageCompletionTimeText}
                          </span>
                        ) : null}
                        <Badge variant="dark">
                          {kitchen.activeListCount} active lists
                        </Badge>
                      </div>
                    </div>

                    {isExecutive ? (
                      <div className="mt-4 border-t border-[var(--stroke-soft)] pt-3">
                        <div className="flex items-center justify-between text-xs text-[var(--text-muted)] mb-1.5 font-medium">
                          <span>Completion progress</span>
                          <span>{kitchen.completionPercentage}%</span>
                        </div>
                        <div className="h-2 w-full rounded-full bg-[var(--stroke-soft)] overflow-hidden">
                          <div
                            className="h-full bg-blue-500 rounded-full transition-all duration-500"
                            style={{ width: `${kitchen.completionPercentage}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                className="p-0 shadow-none border-0 bg-transparent"
                title="No visible kitchens"
                description="This user currently has no kitchen access."
              />
            )}
          </div>
        </Card>

        {isSuperAdmin ? null : (
          <Card className="p-5 sm:p-6">
            <div className="flex items-center justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text-primary)]">
                  Recent activity
                </h3>
                <p className="mt-1 text-sm text-[var(--text-muted)]">
                  Latest actions across visible kitchens and lists.
                </p>
              </div>
              <Badge variant="success">{recentActivity.length} events</Badge>
            </div>

            <div className="mt-5">
              {recentActivity.length ? (
                <div className="space-y-3">
                  {recentActivity.map((log) => (
                    <div
                      key={log.id}
                      className="rounded-[20px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4"
                    >
                      <p className="text-sm font-medium text-[var(--text-primary)]">
                        {log.message}
                      </p>
                      <p className="mt-1 text-xs text-[var(--text-muted)]">
                        {formatDate(log.createdAt)} · {formatTime(log.createdAt)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyState
                  className="p-0 shadow-none border-0 bg-transparent"
                  title="No recent activity"
                  description="Activity will appear here when users create, join, or complete tasks."
                />
              )}
            </div>
          </Card>
        )}
      </div>

      <Card className="p-5 sm:p-6">
        <div className="flex items-center justify-between gap-4">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Logged-in staff visibility
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Shows who is active, their working section, and open tasks in that section.
            </p>
          </div>
          <Badge>{activeStaff.length} staff</Badge>
        </div>

        <div className="mt-5">
          {activeStaff.length ? (
            <div className="grid gap-4 lg:grid-cols-2">
              {activeStaff.map((staff) => (
                <div
                  key={staff.id}
                  className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-base font-semibold text-[var(--text-primary)]">
                        {staff.name}
                      </p>
                      <p className="text-sm text-[var(--text-muted)]">
                        {staff.role} · {staff.kitchenName}
                      </p>
                    </div>
                    <Badge variant="dark">{staff.activeTasks} active tasks</Badge>
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{staff.workingSection}</Badge>
                    {staff.joinedViaCode ? <Badge variant="success">Joined via code</Badge> : null}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              className="p-0 shadow-none border-0 bg-transparent"
              title="No active staff visible"
              description="Staff visibility will appear here for the current role scope."
            />
          )}
        </div>
      </Card>
    </FeaturePageShell>
  );
}
