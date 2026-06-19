import { Link } from "react-router-dom";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Drawer from "../../../shared/ui/Drawer";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import PageLoader from "../../../shared/ui/PageLoader";
import { ROUTES } from "../../../shared/constants/routes";
import RecipeIngredientsList from "./RecipeIngredientsList";
import RecipeStepsList from "./RecipeStepsList";
import { useRecipeDetailsQuery } from "../api/useRecipeDetailsQuery";

export default function RecipeDetailDrawer({
  recipeId,
  open,
  onClose,
  onEdit,
  canManage = false,
}) {
  const { data, isLoading, isError, error } = useRecipeDetailsQuery(
    open ? recipeId : null
  );

  return (
    <Drawer
      open={open}
      onClose={onClose}
      title="Recipe details"
      description="Recipe book instructions linked to operational checklist tasks."
    >
      {isLoading ? <PageLoader /> : null}

      {!isLoading && isError ? <ErrorState title="Unable to load recipe" error={error} /> : null}

      {!isLoading && !isError && !data?.recipe ? (
        <EmptyState
          title="Recipe not found"
          description="This recipe is not available in the current recipe book scope."
        />
      ) : null}

      {!isLoading && !isError && data?.recipe ? (
        <div className="space-y-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="text-xl font-semibold text-[var(--text-primary)]">
                {data.recipe.title}
              </h3>
              <p className="mt-1 text-sm text-[var(--text-muted)]">
                {data.recipe.section} · {data.recipe.category}
              </p>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge>{data.recipe.yield || "Yield not set"}</Badge>
              <Badge variant="dark">
                {data.recipe.prepTimeMinutes
                  ? `${data.recipe.prepTimeMinutes} min`
                  : "No time"}
              </Badge>
            </div>
          </div>

          {data.recipe.notes ? (
            <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
              <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                Notes
              </p>
              <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                {data.recipe.notes}
              </p>
            </div>
          ) : null}

          <RecipeIngredientsList ingredients={data.recipe.ingredients} />
          <RecipeStepsList steps={data.recipe.steps} />

          <div className="space-y-3">
            <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Linked checklist items
            </h4>

            {Array.isArray(data.linkedItems) && data.linkedItems.length ? (
              <div className="space-y-2">
                {data.linkedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[16px] bg-[var(--surface-soft)] px-4 py-3"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {item.listTitle} · {item.section}
                    </p>
                    <div className="mt-3">
                      <Link to={`${ROUTES.LIST_MONITORING}/${item.listId}`}>
                        <Button variant="secondary" className="px-3 py-2">
                          Open list
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                className="border-0 bg-transparent p-0 shadow-none"
                title="No linked tasks"
                description="This recipe is not linked to any visible checklist items yet."
              />
            )}
          </div>

          {canManage ? (
            <div className="flex justify-end">
              <Button variant="secondary" onClick={() => onEdit?.(data.recipe)}>
                Edit recipe
              </Button>
            </div>
          ) : null}
        </div>
      ) : null}
    </Drawer>
  );
}
