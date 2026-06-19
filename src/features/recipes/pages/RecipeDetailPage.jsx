import { useNavigate, useParams } from "react-router-dom";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import { ROUTES } from "../../../shared/constants/routes";
import RecipeIngredientsList from "../components/RecipeIngredientsList";
import RecipeStepsList from "../components/RecipeStepsList";
import { useRecipeDetailsQuery } from "../api/useRecipeDetailsQuery";

export default function RecipeDetailPage() {
  const { recipeId } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError, error } = useRecipeDetailsQuery(recipeId);

  if (isLoading) {
    return <PageLoader />;
  }

  if (isError) {
    if (error?.status === 404) {
      return (
        <FeaturePageShell
          title="Recipe details"
          description="Recipe details could not be found."
        >
          <EmptyState
            title="Recipe not found"
            description="The selected recipe does not exist in the current recipe book scope."
          />
        </FeaturePageShell>
      );
    }

    return (
      <FeaturePageShell
        title="Recipe details"
        description="Recipe details could not be loaded."
      >
        <ErrorState title="Unable to load recipe" error={error} />
      </FeaturePageShell>
    );
  }

  if (!data?.recipe) {
    return (
      <FeaturePageShell
        title="Recipe details"
        description="Recipe details could not be found."
      >
        <EmptyState
          title="Recipe not found"
          description="The selected recipe does not exist in the current recipe book scope."
        />
      </FeaturePageShell>
    );
  }

  const linkedItems = Array.isArray(data.linkedItems) ? data.linkedItems : [];

  return (
    <FeaturePageShell
      title={data.recipe.title}
      description={`${data.recipe.section} · ${data.recipe.category}`}
      actions={
        <Button variant="secondary" onClick={() => navigate(-1)}>
          Back
        </Button>
      }
    >
      <div className="grid gap-5 xl:grid-cols-[0.95fr_1.05fr]">
        <div className="min-w-0 space-y-5">
          <Card className="p-5 sm:p-6">
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
              <div className="mt-5 rounded-[18px] bg-[var(--surface-soft)] p-4">
                <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
                  Notes
                </p>
                <p className="mt-2 text-sm leading-6 text-[var(--text-primary)]">
                  {data.recipe.notes}
                </p>
              </div>
            ) : null}
          </Card>

          <Card className="p-5 sm:p-6">
            <RecipeIngredientsList ingredients={data.recipe.ingredients} />
          </Card>
        </div>

        <div className="min-w-0 space-y-5">
          <Card className="p-5 sm:p-6">
            <RecipeStepsList steps={data.recipe.steps} />
          </Card>

          <Card className="p-5 sm:p-6">
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Linked checklist items
            </h3>

            <div className="mt-4 space-y-3">
              {linkedItems.length ? (
                linkedItems.map((item) => (
                  <div
                    key={item.id}
                    className="rounded-[18px] bg-[var(--surface-soft)] px-4 py-4"
                  >
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {item.title}
                    </p>
                    <p className="mt-1 text-xs text-[var(--text-muted)]">
                      {item.listTitle} · {item.section}
                    </p>

                    <div className="mt-3">
                      <Button
                        variant="secondary"
                        onClick={() =>
                          navigate(`${ROUTES.LIST_MONITORING}/${item.listId}`)
                        }
                      >
                        Open list
                      </Button>
                    </div>
                  </div>
                ))
              ) : (
                <EmptyState
                  className="border-0 bg-transparent p-0 shadow-none"
                  title="No linked tasks"
                  description="This recipe is not linked to any visible checklist items yet."
                />
              )}
            </div>
          </Card>
        </div>
      </div>
    </FeaturePageShell>
  );
}
