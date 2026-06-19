import { useEffect, useMemo, useState } from "react";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import Checkbox from "../../../shared/ui/Checkbox";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import Input from "../../../shared/ui/Input";
import Modal from "../../../shared/ui/Modal";
import PageLoader from "../../../shared/ui/PageLoader";
import Table from "../../../shared/ui/Table";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";
import useAuthStore from "../../../store/useAuthStore";
import {
  useRestaurantSubscriptionUsageQuery,
  useSubscriptionPlansQuery,
} from "../api/useSubscriptionQuery";
import {
  useCreateSubscriptionPlanMutation,
  useDeleteSubscriptionPlanMutation,
  useRemoveRestaurantPlanMutation,
  useUpdateSubscriptionPlanMutation,
} from "../api/useSubscriptionMutations";
import SubscriptionCard from "../components/SubscriptionCard";
import PlanFeatureList from "../components/PlanFeatureList";

const ASSIGNED_PLAN_DELETE_MESSAGE =
  "This plan is assigned to restaurants and cannot be deleted.";

const EMPTY_PLAN_FORM = {
  name: "",
  price: "",
  billingLabel: "",
  description: "",
  featuresText: "",
  recommended: false,
  isActive: true,
};

function getMutationErrorMessage(error, fallback) {
  return error?.data?.message || error?.message || fallback;
}

function getStatusVariant(status) {
  const normalized = String(status ?? "").toLowerCase();
  if (normalized === "active") return "success";
  if (normalized === "inactive" || normalized === "disabled") return "warning";
  return "neutral";
}

function getPlanBadgeVariant(row) {
  if (!row?.subscriptionPlanId) return "neutral";
  if (row?.currentPlan?.isActive === false) return "warning";
  return "dark";
}

function formatLastUpdated(value) {
  if (!value) return "Not recorded";
  return `${formatDate(value)} · ${formatTime(value)}`;
}

function getActiveRestaurantCountByPlanName(plans, rows, planName) {
  const planIds = new Set(
    (Array.isArray(plans) ? plans : [])
      .filter((plan) => String(plan?.name ?? "").toLowerCase() === planName)
      .map((plan) => plan.id)
  );

  return (Array.isArray(rows) ? rows : []).filter(
    (row) => row.isActive && planIds.has(row.subscriptionPlanId)
  ).length;
}

function SummaryCard({ label, value }) {
  return (
    <Card className="p-4 sm:p-5">
      <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        {label}
      </p>
      <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
        {value}
      </p>
    </Card>
  );
}

export default function SubscriptionPage() {
  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManagePlans = hasPermission(PERMISSIONS.MANAGE_SUBSCRIPTION);

  const plansQuery = useSubscriptionPlansQuery();
  const usageQuery = useRestaurantSubscriptionUsageQuery();

  const createPlanMutation = useCreateSubscriptionPlanMutation();
  const updatePlanMutation = useUpdateSubscriptionPlanMutation();
  const deletePlanMutation = useDeleteSubscriptionPlanMutation();
  const removePlanMutation = useRemoveRestaurantPlanMutation();

  const [successMessage, setSuccessMessage] = useState("");
  const [confirmError, setConfirmError] = useState("");
  const [pendingDeletePlan, setPendingDeletePlan] = useState(null);
  const [pendingViewRestaurant, setPendingViewRestaurant] = useState(null);
  const [pendingRemoveRestaurant, setPendingRemoveRestaurant] = useState(null);
  const [removeError, setRemoveError] = useState("");
  const [planEditorMode, setPlanEditorMode] = useState(null);
  const [planEditorPlanId, setPlanEditorPlanId] = useState(null);
  const [planFormError, setPlanFormError] = useState("");
  const [planForm, setPlanForm] = useState(EMPTY_PLAN_FORM);

  const rawPlans = plansQuery.data?.plans;
  const rawUsageRows = usageQuery.data?.rows;

  const plans = useMemo(
    () => (Array.isArray(rawPlans) ? rawPlans : []),
    [rawPlans]
  );

  const usageRows = useMemo(
    () => (Array.isArray(rawUsageRows) ? rawUsageRows : []),
    [rawUsageRows]
  );

  const restaurantCountsByPlanId = useMemo(() => {
    return usageRows.reduce((accumulator, row) => {
      const planId = row.subscriptionPlanId;
      if (!planId) return accumulator;
      accumulator.set(planId, (accumulator.get(planId) ?? 0) + 1);
      return accumulator;
    }, new Map());
  }, [usageRows]);

  const summaryCards = useMemo(
    () => [
      { label: "Total plans", value: plans.length },
      {
        label: "Active restaurants using Free Basic",
        value: getActiveRestaurantCountByPlanName(plans, usageRows, "free basic"),
      },
      {
        label: "Active restaurants using Standard",
        value: getActiveRestaurantCountByPlanName(plans, usageRows, "standard"),
      },
      {
        label: "Active restaurants using Premium",
        value: getActiveRestaurantCountByPlanName(plans, usageRows, "premium"),
      },
    ],
    [plans, usageRows]
  );

  const isLoading = plansQuery.isLoading || usageQuery.isLoading;
  const isError = plansQuery.isError || usageQuery.isError;
  const error = plansQuery.error || usageQuery.error;

  const isPlanSaving = createPlanMutation.isPending || updatePlanMutation.isPending;
  const isPlanBusy =
    isPlanSaving || deletePlanMutation.isPending || removePlanMutation.isPending;

  useEffect(() => {
    if (!successMessage) return undefined;

    const timeout = window.setTimeout(() => {
      setSuccessMessage("");
    }, 4_000);

    return () => window.clearTimeout(timeout);
  }, [successMessage]);

  function openCreatePlan() {
    setPlanFormError("");
    setPlanEditorMode("create");
    setPlanEditorPlanId(null);
    setPlanForm({
      ...EMPTY_PLAN_FORM,
      billingLabel: "/restaurant monthly",
      isActive: true,
    });
  }

  function openEditPlan(plan) {
    if (!plan?.id) return;

    setPlanFormError("");
    setPlanEditorMode("edit");
    setPlanEditorPlanId(plan.id);
    setPlanForm({
      name: plan.name ?? "",
      price: plan.price ?? "",
      billingLabel: plan.billingLabel ?? "",
      description: plan.description ?? "",
      featuresText: Array.isArray(plan.features) ? plan.features.join("\n") : "",
      recommended: Boolean(plan.recommended),
      isActive: plan.isActive !== false,
    });
  }

  function closePlanEditor() {
    if (isPlanSaving) return;
    setPlanFormError("");
    setPlanEditorMode(null);
    setPlanEditorPlanId(null);
  }

  async function handleSavePlan() {
    const name = String(planForm.name ?? "").trim();
    const price = String(planForm.price ?? "").trim();
    const billingLabel = String(planForm.billingLabel ?? "").trim();
    const description = String(planForm.description ?? "").trim();
    const featuresText = String(planForm.featuresText ?? "");

    if (!name) {
      setPlanFormError("Plan name is required.");
      return;
    }

    if (!price) {
      setPlanFormError("Plan price is required.");
      return;
    }

    setPlanFormError("");

    const payload = {
      name,
      price,
      billingLabel,
      description,
      features: featuresText,
      recommended: Boolean(planForm.recommended),
      isActive: Boolean(planForm.isActive),
    };

    try {
      if (planEditorMode === "edit" && planEditorPlanId) {
        await updatePlanMutation.mutateAsync({ planId: planEditorPlanId, payload });
        setSuccessMessage("Subscription plan updated.");
      } else {
        await createPlanMutation.mutateAsync(payload);
        setSuccessMessage("Subscription plan created.");
      }

      closePlanEditor();
    } catch (mutationError) {
      setPlanFormError(
        getMutationErrorMessage(mutationError, "Unable to save subscription plan.")
      );
    }
  }

  function handleRequestDelete(plan) {
    if (!plan?.id || !canManagePlans || deletePlanMutation.isPending) return;

    const restaurantCount = restaurantCountsByPlanId.get(plan.id) ?? 0;
    setPendingDeletePlan({ ...plan, restaurantCount });
    setConfirmError(restaurantCount > 0 ? ASSIGNED_PLAN_DELETE_MESSAGE : "");
  }

  function handleCloseDelete() {
    if (deletePlanMutation.isPending) return;
    setConfirmError("");
    setPendingDeletePlan(null);
  }

  async function handleConfirmDelete() {
    if (!pendingDeletePlan?.id) return;

    if ((pendingDeletePlan.restaurantCount ?? 0) > 0) {
      setConfirmError(ASSIGNED_PLAN_DELETE_MESSAGE);
      return;
    }

    setConfirmError("");

    try {
      await deletePlanMutation.mutateAsync(pendingDeletePlan.id);
      setSuccessMessage("Subscription plan deleted.");
      setPendingDeletePlan(null);
    } catch (mutationError) {
      setConfirmError(
        getMutationErrorMessage(mutationError, "Unable to delete subscription plan.")
      );
    }
  }

  function handleViewRestaurant(row) {
    if (!row?.kitchenId) return;
    setPendingViewRestaurant(row);
  }

  function closeViewRestaurant() {
    setPendingViewRestaurant(null);
  }

  function handleRequestRemoveRestaurantPlan(row) {
    if (!row?.kitchenId || !canManagePlans || removePlanMutation.isPending) return;
    setRemoveError("");
    setPendingRemoveRestaurant(row);
  }

  function closeRemoveRestaurantPlan() {
    if (removePlanMutation.isPending) return;
    setRemoveError("");
    setPendingRemoveRestaurant(null);
  }

  async function handleConfirmRemoveRestaurantPlan() {
    if (!pendingRemoveRestaurant?.kitchenId) return;

    setRemoveError("");

    try {
      await removePlanMutation.mutateAsync(pendingRemoveRestaurant.kitchenId);
      setSuccessMessage(
        `Subscription plan removed from ${pendingRemoveRestaurant.restaurantName}.`
      );
      setPendingRemoveRestaurant(null);
    } catch (mutationError) {
      setRemoveError(
        getMutationErrorMessage(mutationError, "Unable to remove subscription plan.")
      );
    }
  }

  const usageColumns = [
    {
      key: "restaurantName",
      label: "Restaurant/Kitchen",
      cellClassName: "min-w-[190px]",
    },
    {
      key: "companyName",
      label: "Company",
      cellClassName: "min-w-[140px]",
    },
    {
      key: "currentPlanName",
      label: "Current Plan",
      cellClassName: "min-w-[150px] whitespace-nowrap",
      render: (row) => (
        <Badge variant={getPlanBadgeVariant(row)}>
          {row.currentPlanName}
        </Badge>
      ),
    },
    {
      key: "location",
      label: "Location",
      cellClassName: "min-w-[150px]",
    },
    {
      key: "status",
      label: "Status",
      cellClassName: "min-w-[110px] whitespace-nowrap",
      render: (row) => <Badge variant={getStatusVariant(row.rawStatus)}>{row.status}</Badge>,
    },
    {
      key: "actions",
      label: "Actions",
      headerClassName: "min-w-[210px]",
      cellClassName: "min-w-[210px]",
      render: (row) => (
        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={() => handleViewRestaurant(row)}
          >
            View
          </Button>

          {canManagePlans ? (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={removePlanMutation.isPending || !row.subscriptionPlanId}
              className="border border-red-200 text-red-700 hover:bg-red-50"
              onClick={() => handleRequestRemoveRestaurantPlan(row)}
            >
              Remove plan
            </Button>
          ) : null}
        </div>
      ),
    },
  ];

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <FeaturePageShell
        title="Subscription"
        description="Manage mock restaurant subscription plans and restaurant-level limits."
      >
        <ErrorState title="Unable to load subscription" error={error} />
      </FeaturePageShell>
    );
  }

  return (
    <FeaturePageShell
      title="Subscription"
      description="Manage mock restaurant subscription plans and restaurant-level limits."
      actions={
        canManagePlans ? (
          <Button variant="secondary" onClick={openCreatePlan}>
            Add Plan
          </Button>
        ) : null
      }
    >
      {successMessage ? (
        <div className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--success-soft)] px-4 py-3">
          <p className="text-sm font-medium text-[var(--success-strong)]">
            {successMessage}
          </p>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {summaryCards.map((card) => (
          <SummaryCard key={card.label} label={card.label} value={card.value} />
        ))}
      </div>

      <section className="space-y-3">
        <div className="flex min-w-0 flex-wrap items-center justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Plan definitions
            </h3>
          </div>
        </div>

        {plans.length ? (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <SubscriptionCard
                key={plan.id}
                plan={plan}
                restaurantCount={restaurantCountsByPlanId.get(plan.id) ?? 0}
                canManagePlans={canManagePlans}
                isBusy={isPlanBusy}
                onEdit={openEditPlan}
                onDelete={handleRequestDelete}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No subscription plans available"
            description="Subscription plans are not configured in the mock database."
          />
        )}
      </section>

      <section className="space-y-3">
        <div className="min-w-0">
          <h3 className="text-lg font-semibold text-[var(--text-primary)]">
            Restaurant usage
          </h3>
        </div>

        <Card className="p-4 sm:p-5">
          <Table
            columns={usageColumns}
            rows={usageRows}
            mobileCardTitleKey="restaurantName"
            tableMinWidthClassName="min-w-[920px]"
            emptyMessage="No restaurants or kitchens are available for this scope."
          />
        </Card>
      </section>

      <Modal
        open={Boolean(pendingViewRestaurant)}
        onClose={closeViewRestaurant}
        title="Restaurant subscription"
        description="Read-only restaurant subscription details."
        className="max-w-[640px]"
      >
        {pendingViewRestaurant ? (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              {[
                ["Restaurant/Kitchen", pendingViewRestaurant.restaurantName],
                ["Company", pendingViewRestaurant.companyName],
                ["Current plan", pendingViewRestaurant.currentPlanName],
                ["Location", pendingViewRestaurant.location],
                ["Status", pendingViewRestaurant.status],
                ["Last updated", formatLastUpdated(pendingViewRestaurant.lastUpdatedAt)],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="rounded-[18px] bg-[var(--surface-soft)] p-4"
                >
                  <p className="text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
                    {label}
                  </p>
                  <p className="mt-2 break-words text-sm font-medium text-[var(--text-primary)]">
                    {value}
                  </p>
                </div>
              ))}
            </div>

            <div>
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Plan features
              </p>
              <PlanFeatureList features={pendingViewRestaurant.currentPlan?.features} />
            </div>

            <div className="flex justify-end">
              <Button type="button" variant="secondary" onClick={closeViewRestaurant}>
                Close
              </Button>
            </div>
          </div>
        ) : null}
      </Modal>

      <Modal
        open={Boolean(pendingRemoveRestaurant)}
        onClose={closeRemoveRestaurantPlan}
        title={
          pendingRemoveRestaurant?.restaurantName
            ? `Remove subscription plan from ${pendingRemoveRestaurant.restaurantName}?`
            : "Remove subscription plan?"
        }
        description="This clears the restaurant plan assignment only."
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            The restaurant/kitchen record will remain in the table.
          </p>

          {removeError ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{removeError}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={closeRemoveRestaurantPlan}
              disabled={removePlanMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={handleConfirmRemoveRestaurantPlan}
              disabled={removePlanMutation.isPending}
              className="border border-red-200 text-red-700 hover:bg-red-50"
            >
              {removePlanMutation.isPending ? "Removing..." : "Remove plan"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(planEditorMode)}
        onClose={closePlanEditor}
        title={planEditorMode === "edit" ? "Edit plan" : "Add plan"}
        description="Manage mock subscription plan definitions."
        className="max-w-[640px]"
      >
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Plan name
              </label>
              <Input
                value={planForm.name}
                onChange={(event) =>
                  setPlanForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="Premium"
                disabled={isPlanSaving}
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-sm font-medium text-[var(--text-primary)]">
                Price
              </label>
              <Input
                value={planForm.price}
                onChange={(event) =>
                  setPlanForm((prev) => ({ ...prev, price: event.target.value }))
                }
                placeholder="$99"
                disabled={isPlanSaving}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Billing label
            </label>
            <Input
              value={planForm.billingLabel}
              onChange={(event) =>
                setPlanForm((prev) => ({ ...prev, billingLabel: event.target.value }))
              }
              placeholder="/restaurant monthly"
              disabled={isPlanSaving}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Description
            </label>
            <Input
              value={planForm.description}
              onChange={(event) =>
                setPlanForm((prev) => ({ ...prev, description: event.target.value }))
              }
              placeholder="Premium restaurant plan for multi-location reporting."
              disabled={isPlanSaving}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-sm font-medium text-[var(--text-primary)]">
              Features (one per line)
            </label>
            <textarea
              value={planForm.featuresText}
              onChange={(event) =>
                setPlanForm((prev) => ({ ...prev, featuresText: event.target.value }))
              }
              rows={7}
              disabled={isPlanSaving}
              className="w-full rounded-[18px] border border-[var(--stroke-soft)] bg-white px-4 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-[var(--surface-strong)]/20 disabled:cursor-not-allowed disabled:opacity-60"
              placeholder={"Multi-location support\nAdvanced reports\nStaff analytics"}
            />
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <Checkbox
              id="subscription-plan-recommended"
              checked={planForm.recommended}
              disabled={isPlanSaving}
              onChange={(checked) =>
                setPlanForm((prev) => ({ ...prev, recommended: checked }))
              }
              label="Recommended"
            />

            <Checkbox
              id="subscription-plan-active"
              checked={planForm.isActive}
              disabled={isPlanSaving}
              onChange={(checked) =>
                setPlanForm((prev) => ({ ...prev, isActive: checked }))
              }
              label="Active"
            />
          </div>

          {planFormError ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{planFormError}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={closePlanEditor}
              disabled={isPlanSaving}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleSavePlan} disabled={isPlanSaving}>
              {isPlanSaving ? "Saving..." : "Save plan"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        open={Boolean(pendingDeletePlan)}
        onClose={handleCloseDelete}
        title={pendingDeletePlan?.name ? `Delete ${pendingDeletePlan.name}?` : "Delete plan?"}
        description="This removes a mock plan definition."
      >
        <div className="space-y-4">
          <p className="text-sm leading-6 text-[var(--text-muted)]">
            {pendingDeletePlan?.restaurantCount
              ? `${pendingDeletePlan.restaurantCount} restaurant${
                  pendingDeletePlan.restaurantCount === 1 ? "" : "s"
                } currently use this plan.`
              : "This plan is not assigned to any restaurant."}
          </p>

          {confirmError ? (
            <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
              <p className="text-sm text-red-700">{confirmError}</p>
            </div>
          ) : null}

          <div className="flex flex-wrap justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={handleCloseDelete}
              disabled={deletePlanMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={
                deletePlanMutation.isPending ||
                (pendingDeletePlan?.restaurantCount ?? 0) > 0
              }
              className="bg-red-600 text-white hover:bg-red-600/90"
            >
              {deletePlanMutation.isPending ? "Deleting..." : "Delete"}
            </Button>
          </div>
        </div>
      </Modal>
    </FeaturePageShell>
  );
}
