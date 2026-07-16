import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";

export default function RecipeCard({
  recipe,
  onOpen,
  onEdit,
  canManage = false,
}) {
  return (
    <Card className="p-5 sm:p-6">
      {recipe.imageUrl ? (
        <div className="mb-4 h-36 w-full rounded-[18px] overflow-hidden border border-[var(--stroke-soft)] bg-[var(--surface-soft)]">
          <img
            src={recipe.imageUrl}
            alt={recipe.title}
            className="h-full w-full object-cover"
          />
        </div>
      ) : null}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold text-[var(--text-primary)]">
            {recipe.title}
          </h3>
          <p className="mt-1 text-sm text-[var(--text-muted)]">
            {recipe.section} · {recipe.category}
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge>{recipe.yield || "Yield not set"}</Badge>
          <Badge variant="dark">
            {recipe.prepTimeMinutes ? `${recipe.prepTimeMinutes} min` : "No time"}
          </Badge>
        </div>
      </div>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Ingredients
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            {Array.isArray(recipe.ingredients) ? recipe.ingredients.length : 0}
          </p>
        </div>

        <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
          <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
            Steps
          </p>
          <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
            {Array.isArray(recipe.steps) ? recipe.steps.length : 0}
          </p>
        </div>
      </div>

      {recipe.notes ? (
        <p className="mt-4 line-clamp-2 text-sm leading-6 text-[var(--text-muted)]">
          {recipe.notes}
        </p>
      ) : null}

      <div className="mt-5 flex flex-wrap items-center gap-3">
        <Button variant="secondary" onClick={() => onOpen?.(recipe.id)}>
          View recipe
        </Button>

        {canManage ? (
          <Button variant="ghost" onClick={() => onEdit?.(recipe)}>
            Edit recipe
          </Button>
        ) : null}
      </div>
    </Card>
  );
}