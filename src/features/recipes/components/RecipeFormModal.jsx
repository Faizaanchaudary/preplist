import { useMemo, useState } from "react";
import Button from "../../../shared/ui/Button";
import Input from "../../../shared/ui/Input";
import Modal from "../../../shared/ui/Modal";
import Select from "../../../shared/ui/Select";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import useAuthStore from "../../../store/useAuthStore";
import {
  useCreateRecipeMutation,
  useSubmitRecipeDraftMutation,
  useUpdateRecipeMutation,
} from "../api/useRecipeMutations";

function getLinesFromText(value) {
  return String(value)
    .split("\n")
    .map((item) => item.trim())
    .filter(Boolean);
}

function getInitialValues({ recipe, draft, kitchenOptions = [] }) {
  const source = recipe ?? draft ?? null;
  const fallbackKitchenId = kitchenOptions[0]?.value ?? "";

  return {
    title: source?.title ?? "",
    section: source?.section ?? "",
    category: source?.category ?? "",
    prepTimeMinutes:
      source?.prepTimeMinutes || source?.prepTimeMinutes === 0
        ? String(source.prepTimeMinutes)
        : "",
    yield: source?.yield ?? "",
    notes: source?.notes ?? "",
    kitchenId:
      Array.isArray(source?.kitchenIds) && source.kitchenIds.length
        ? source.kitchenIds[0]
        : fallbackKitchenId,
    ingredientsText: Array.isArray(source?.ingredients)
      ? source.ingredients.join("\n")
      : "",
    stepsText: Array.isArray(source?.steps) ? source.steps.join("\n") : "",
  };
}

function TextAreaField(props) {
  return (
    <textarea
      {...props}
      className="min-h-[120px] w-full rounded-[16px] border border-[var(--stroke-soft)] bg-white px-3 py-3 text-sm text-[var(--text-primary)] outline-none transition-colors placeholder:text-[var(--text-muted)] focus:border-[var(--surface-strong)] focus-visible:ring-2 focus-visible:ring-[var(--surface-strong)]/20 sm:rounded-[18px] sm:px-4"
    />
  );
}

export default function RecipeFormModal({
  open,
  onClose,
  onSaved,
  recipe = null,
  draft = null,
  kitchenOptions = [],
}) {
  const createMutation = useCreateRecipeMutation();
  const updateMutation = useUpdateRecipeMutation();
  const submitDraftMutation = useSubmitRecipeDraftMutation();

  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManageRecipes = hasPermission(PERMISSIONS.MANAGE_RECIPES);
  const canSubmitDrafts = hasPermission(PERMISSIONS.SCAN_RECIPE_DRAFTS);

  const [formValues, setFormValues] = useState(
    () => getInitialValues({ recipe, draft, kitchenOptions })
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [localError, setLocalError] = useState("");

  const activeMutation = recipe
    ? updateMutation
    : canManageRecipes
      ? createMutation
      : submitDraftMutation;
  const mutationError = activeMutation.error?.message || localError;

  const validation = useMemo(() => {
    const next = {};

    if (!formValues.title.trim()) next.title = "Recipe title is required.";
    if (!formValues.section.trim()) next.section = "Section is required.";
    if (!formValues.kitchenId.trim()) next.kitchenId = "Kitchen is required.";
    if (!getLinesFromText(formValues.ingredientsText).length) {
      next.ingredientsText = "At least one ingredient is required.";
    }
    if (!getLinesFromText(formValues.stepsText).length) {
      next.stepsText = "At least one step is required.";
    }

    return next;
  }, [formValues]);

  const hasErrors = Object.keys(validation).length > 0;

  function handleChange(event) {
    const { name, value } = event.target;

    setFormValues((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (localError) {
      setLocalError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setHasSubmitted(true);

    if (!recipe && !canManageRecipes && !canSubmitDrafts) {
      setLocalError("You do not have permission to save recipes.");
      return;
    }

    if (hasErrors || activeMutation.isPending) {
      if (hasErrors) {
        setLocalError("Please complete the required recipe fields.");
      }
      return;
    }

    const payload = {
      title: formValues.title.trim(),
      section: formValues.section.trim(),
      category: formValues.category.trim() || "General",
      prepTimeMinutes: formValues.prepTimeMinutes.trim()
        ? Number(formValues.prepTimeMinutes)
        : null,
      yield: formValues.yield.trim(),
      notes: formValues.notes.trim(),
      kitchenIds: [formValues.kitchenId.trim()],
      ingredients: getLinesFromText(formValues.ingredientsText),
      steps: getLinesFromText(formValues.stepsText),
    };

    try {
      const data = recipe
        ? await updateMutation.mutateAsync({
            recipeId: recipe.id,
            payload,
          })
        : canManageRecipes
          ? await createMutation.mutateAsync(payload)
          : await submitDraftMutation.mutateAsync(payload);

      onSaved?.(data?.recipe ?? null);
      onClose?.();
    } catch {
      // Mutation error is surfaced from query state.
    }
  }

  return (
    <Modal
      open={open}
      onClose={activeMutation.isPending ? undefined : onClose}
      title={
        recipe
          ? "Edit recipe"
          : canManageRecipes
            ? "Add recipe"
            : "Submit recipe draft"
      }
      description={
        canManageRecipes
          ? "Create or update recipes that can be opened directly from checklist items."
          : "Staff CSV imports are saved as drafts pending chef approval. No live recipe is created yet."
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Recipe title
            </label>
            <Input
              name="title"
              value={formValues.title}
              onChange={handleChange}
              placeholder="Mayonnaise"
            />
            {hasSubmitted && validation.title ? (
              <p className="mt-2 text-xs text-red-500">{validation.title}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Kitchen
            </label>
            <Select
              name="kitchenId"
              value={formValues.kitchenId}
              onChange={handleChange}
              options={kitchenOptions}
            />
            {hasSubmitted && validation.kitchenId ? (
              <p className="mt-2 text-xs text-red-500">{validation.kitchenId}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Section
            </label>
            <Input
              name="section"
              value={formValues.section}
              onChange={handleChange}
              placeholder="Cold Section"
            />
            {hasSubmitted && validation.section ? (
              <p className="mt-2 text-xs text-red-500">{validation.section}</p>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Category
            </label>
            <Input
              name="category"
              value={formValues.category}
              onChange={handleChange}
              placeholder="Sauce"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Prep time (minutes)
            </label>
            <Input
              name="prepTimeMinutes"
              type="number"
              min="0"
              value={formValues.prepTimeMinutes}
              onChange={handleChange}
              placeholder="10"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Yield
            </label>
            <Input
              name="yield"
              value={formValues.yield}
              onChange={handleChange}
              placeholder="1 batch"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Ingredients
            </label>
            <TextAreaField
              name="ingredientsText"
              value={formValues.ingredientsText}
              onChange={handleChange}
              placeholder={"2 egg yolks\n1 tbsp mustard\n250ml oil"}
            />
            {hasSubmitted && validation.ingredientsText ? (
              <p className="mt-2 text-xs text-red-500">
                {validation.ingredientsText}
              </p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Steps
            </label>
            <TextAreaField
              name="stepsText"
              value={formValues.stepsText}
              onChange={handleChange}
              placeholder={"Whisk yolks and mustard.\nSlowly stream in oil.\nSeason and chill."}
            />
            {hasSubmitted && validation.stepsText ? (
              <p className="mt-2 text-xs text-red-500">{validation.stepsText}</p>
            ) : null}
          </div>

          <div className="sm:col-span-2">
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Notes
            </label>
            <TextAreaField
              name="notes"
              value={formValues.notes}
              onChange={handleChange}
              placeholder="Any handling, safety, or storage notes"
            />
          </div>
        </div>

        {mutationError ? (
          <div className="rounded-[18px] border border-red-200 bg-red-50 px-4 py-3">
            <p className="text-sm text-red-700">{mutationError}</p>
          </div>
        ) : null}

        <div className="flex flex-wrap justify-end gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
            disabled={activeMutation.isPending}
          >
            Cancel
          </Button>
          <Button type="submit" disabled={activeMutation.isPending}>
            {activeMutation.isPending
              ? "Saving..."
              : recipe
                ? "Save recipe"
                : canManageRecipes
                  ? "Create recipe"
                  : "Submit draft"}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
