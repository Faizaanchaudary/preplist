export default function RecipeIngredientsList({ ingredients = [] }) {
  return (
    <div className="space-y-3">
      <h4 className="text-sm font-semibold uppercase tracking-[0.08em] text-[var(--text-muted)]">
        Ingredients
      </h4>

      <ul className="space-y-2">
        {ingredients.map((item, index) => (
          <li
            key={`${item}-${index}`}
            className="rounded-[16px] bg-[var(--surface-soft)] px-4 py-3 text-sm text-[var(--text-primary)]"
          >
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}