import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import PlanFeatureList from "./PlanFeatureList";

export default function SubscriptionCard({
  plan,
  restaurantCount = 0,
  canManagePlans = false,
  isBusy = false,
  onEdit,
  onDelete,
}) {
  if (!plan) return null;

  const name = plan.name ?? "Plan";
  const price = plan.price ?? "";
  const billingLabel = plan.billingLabel ?? "";
  const description = plan.description ?? "";
  const isRecommended = Boolean(plan.recommended);
  const isActive = plan.isActive !== false;

  return (
    <Card className="flex h-full flex-col p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h3 className="break-words text-lg font-semibold text-[var(--text-primary)]">
              {name}
            </h3>
            {isRecommended ? <Badge variant="dark">Recommended</Badge> : null}
            {!isActive ? <Badge variant="warning">Inactive</Badge> : null}
          </div>

          <p className="mt-2 text-3xl font-semibold text-[var(--text-primary)]">
            {price}
            {billingLabel ? (
              <span className="ml-1 text-sm font-normal text-[var(--text-muted)]">
                {billingLabel}
              </span>
            ) : null}
          </p>
        </div>

        {canManagePlans ? (
          <div className="flex flex-wrap justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBusy}
              onClick={() => onEdit?.(plan)}
            >
              Edit
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              disabled={isBusy}
              className="text-red-600 hover:bg-red-50"
              onClick={() => onDelete?.(plan)}
            >
              Delete
            </Button>
          </div>
        ) : null}
      </div>

      {description ? (
        <p className="mt-3 text-sm leading-6 text-[var(--text-muted)]">
          {description}
        </p>
      ) : null}

      <PlanFeatureList features={plan.features} />

      <div className="mt-5 rounded-[16px] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[var(--text-primary)]">
        <span className="font-semibold">{restaurantCount}</span>{" "}
        {restaurantCount === 1 ? "restaurant" : "restaurants"} using this plan
      </div>
    </Card>
  );
}
