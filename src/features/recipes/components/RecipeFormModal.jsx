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
import { useRecipeCategoriesQuery } from "../api/useRecipeCategoriesQuery";
import { uploadRecipePhotoFile } from "../../../api/recipePhotoUpload";

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
    categoryId: source?.categoryId ?? "",
    category: source?.category ?? "",
    imageUrl: source?.imageUrl ?? "",
    scalingMultiplier: source?.scalingMultiplier ? String(source.scalingMultiplier) : "1",
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
  const { data: categoriesData } = useRecipeCategoriesQuery();

  const categoryOptions = [
    { value: "", label: "Select category" },
    ...(categoriesData?.rows ?? []).map((c) => ({ value: c.id, label: c.name })),
  ];

  const hasPermission = useAuthStore((state) => state.hasPermission);
  const canManageRecipes = hasPermission(PERMISSIONS.MANAGE_RECIPES);
  const canSubmitDrafts = hasPermission(PERMISSIONS.SCAN_RECIPE_DRAFTS);

  const [formValues, setFormValues] = useState(() =>
    getInitialValues({ recipe, draft, kitchenOptions })
  );
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [localError, setLocalError] = useState("");
  const [isUploadingImage, setIsUploadingImage] = useState(false);

  async function handleImageFileChange(event) {
    const file = event.target.files?.[0] ?? null;
    if (!file) return;

    setIsUploadingImage(true);
    setLocalError("");

    try {
      const { url } = await uploadRecipePhotoFile({ file });
      setFormValues((previous) => ({
        ...previous,
        imageUrl: url,
      }));
    } catch (err) {
      setLocalError(err?.message || "Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
  }

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

    const selectedCategory = (categoriesData?.rows ?? []).find(
      (c) => c.id === formValues.categoryId
    );

    const payload = {
      title: formValues.title.trim(),
      section: formValues.section.trim(),
      categoryId: formValues.categoryId || null,
      category: selectedCategory?.name ?? formValues.category.trim() ?? "General",
      imageUrl: formValues.imageUrl.trim() || null,
      scalingMultiplier: Number(formValues.scalingMultiplier) || 1,
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
            <Select
              name="categoryId"
              value={formValues.categoryId}
              onChange={handleChange}
              options={categoryOptions}
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
              Cover Image
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={handleImageFileChange}
              disabled={isUploadingImage}
              className="block w-full rounded-[16px] border border-[var(--stroke-soft)] bg-white px-3 py-3 text-sm text-[var(--text-primary)] file:mr-3 file:rounded-[12px] file:border-0 file:bg-[var(--surface-soft)] file:px-3 file:py-2 file:text-sm file:font-medium disabled:opacity-60 disabled:cursor-not-allowed"
            />
            {isUploadingImage ? (
              <p className="mt-2 text-xs text-[var(--text-muted)] animate-pulse">Uploading cover image...</p>
            ) : null}
            {formValues.imageUrl ? (
              <div className="mt-3 relative h-32 w-full max-w-[240px] rounded-xl overflow-hidden border border-[var(--stroke-soft)] bg-[var(--surface-soft)]">
                <img
                  src={formValues.imageUrl}
                  alt="Cover preview"
                  className="h-full w-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormValues(p => ({ ...p, imageUrl: "" }))}
                  className="absolute top-2 right-2 bg-red-600 text-white rounded-full h-6 w-6 flex items-center justify-center text-xs hover:bg-red-700 transition-colors"
                >
                  ✕
                </button>
              </div>
            ) : null}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-[var(--text-primary)]">
              Default Scaling
            </label>
            <Select
              name="scalingMultiplier"
              value={formValues.scalingMultiplier}
              onChange={handleChange}
              options={[
                { value: "1", label: "x1" },
                { value: "2", label: "x2" },
                { value: "3", label: "x3" },
                { value: "5", label: "x5" },
                { value: "10", label: "x10" },
              ]}
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
