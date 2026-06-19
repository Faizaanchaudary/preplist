import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import EmptyState from "../../../shared/ui/EmptyState";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import useDebouncedValue from "../../../shared/hooks/useDebouncedValue";
import { PERMISSIONS } from "../../../shared/constants/permissions";
import { ROUTES } from "../../../shared/constants/routes";
import { ROLES } from "../../../shared/constants/roles";
import useAuthStore from "../../../store/useAuthStore";
import { useAuthMeQuery } from "../../auth/api/useAuthQuery";
import { useRecipeDraftsQuery } from "../api/useRecipeDraftsQuery";
import { useRecipesQuery } from "../api/useRecipesQuery";
import RecipeCard from "../components/RecipeCard";
import RecipeDetailDrawer from "../components/RecipeDetailDrawer";
import RecipeDraftsDrawer from "../components/RecipeDraftsDrawer";
import RecipeFilters from "../components/RecipeFilters";
import RecipeFormModal from "../components/RecipeFormModal";
import RecipeScanModal from "../components/RecipeScanModal";

export default function RecipeBookPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState("");
  const [section, setSection] = useState("all");
  const [category, setCategory] = useState("all");
  const [editingRecipe, setEditingRecipe] = useState(null);
  const [draftRecipe, setDraftRecipe] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isScanOpen, setIsScanOpen] = useState(false);
  const [isDraftsOpen, setIsDraftsOpen] = useState(false);

  const selectedRecipeId = searchParams.get("recipeId");
  const fromPath = searchParams.get("from");

  const hasPermission = useAuthStore((state) => state.hasPermission);
  const currentUser = useAuthStore((state) => state.currentUser);
  const canManageRecipes = hasPermission(PERMISSIONS.MANAGE_RECIPES);
  const canScanRecipes =
    canManageRecipes || hasPermission(PERMISSIONS.SCAN_RECIPE_DRAFTS);
  const canViewDrafts =
    canManageRecipes ||
    hasPermission(PERMISSIONS.SCAN_RECIPE_DRAFTS) ||
    hasPermission(PERMISSIONS.APPROVE_RECIPE_DRAFTS);
  const canApproveDrafts = hasPermission(PERMISSIONS.APPROVE_RECIPE_DRAFTS);

  const accessibleKitchenIds = Array.isArray(currentUser?.accessibleKitchenIds)
    ? currentUser.accessibleKitchenIds
    : [];
  const shouldShowJoinCta =
    currentUser?.role === ROLES.STAFF && accessibleKitchenIds.length === 0;

  const debouncedSearch = useDebouncedValue(search);

  const recipesQuery = useRecipesQuery({
    search: debouncedSearch,
    section,
    category,
  });
  const authMeQuery = useAuthMeQuery();

  const pendingDraftFilters = useMemo(() => ({ status: "pending" }), []);
  const pendingDraftsQuery = useRecipeDraftsQuery(pendingDraftFilters, {
    enabled: canViewDrafts,
    retry: 0,
    refetchOnWindowFocus: false,
  });
  const pendingDraftCount = Array.isArray(pendingDraftsQuery.data?.rows)
    ? pendingDraftsQuery.data.rows.length
    : 0;

  const kitchenOptions = useMemo(() => {
    const kitchens = Array.isArray(authMeQuery.data?.accessibleKitchens)
      ? authMeQuery.data.accessibleKitchens
      : [];

    return kitchens.map((kitchen) => ({
      value: kitchen.id,
      label: kitchen.siteCode
        ? `${kitchen.name} (${kitchen.siteCode})`
        : kitchen.name,
    }));
  }, [authMeQuery.data]);

  function openRecipe(recipeId) {
    const next = new URLSearchParams(searchParams);
    next.set("recipeId", recipeId);
    setSearchParams(next);
  }

  function closeRecipe() {
    const next = new URLSearchParams(searchParams);
    next.delete("recipeId");
    setSearchParams(next);
  }

  function openCreateModal() {
    setEditingRecipe(null);
    setDraftRecipe(null);
    setIsFormOpen(true);
  }

  function openEditModal(recipe) {
    setEditingRecipe(recipe);
    setDraftRecipe(null);
    setIsFormOpen(true);
  }

  const pageActions = (
    <div className="flex flex-wrap items-center gap-3">
      {fromPath ? (
        <Button
          variant="secondary"
          onClick={() => navigate(decodeURIComponent(fromPath))}
        >
          Back to list
        </Button>
      ) : null}

      {canViewDrafts ? (
        <Button variant="secondary" onClick={() => setIsDraftsOpen(true)}>
          {canApproveDrafts ? "Drafts" : "My drafts"}
          {pendingDraftCount ? (
            <span className="inline-flex h-6 min-w-[24px] items-center justify-center rounded-full bg-[var(--surface-soft)] px-2 text-xs font-semibold text-[var(--text-primary)]">
              {pendingDraftCount}
            </span>
          ) : null}
        </Button>
      ) : null}

      {canScanRecipes ? (
        <Button variant="secondary" onClick={() => setIsScanOpen(true)}>
          Import CSV
        </Button>
      ) : null}

      {canManageRecipes ? <Button onClick={openCreateModal}>Add recipe</Button> : null}
    </div>
  );

  if (shouldShowJoinCta) {
    return (
      <FeaturePageShell
        title="Recipe book"
        description="Recipes linked to checklist tasks so staff can open methods instantly while working."
        actions={
          fromPath ? (
            <Button
              variant="secondary"
              onClick={() => navigate(decodeURIComponent(fromPath))}
            >
              Back to list
            </Button>
          ) : null
        }
      >
        <EmptyState
          title="You are not part of a kitchen yet"
          description="Recipes appear after you join a kitchen or list with an access code."
        >
          <Button onClick={() => navigate(ROUTES.JOIN_BY_CODE)}>
            Join with access code
          </Button>
        </EmptyState>
      </FeaturePageShell>
    );
  }

  const recipes = Array.isArray(recipesQuery.data?.recipes)
    ? recipesQuery.data.recipes
    : [];
  const sections = Array.isArray(recipesQuery.data?.sections)
    ? recipesQuery.data.sections
    : [];
  const categories = Array.isArray(recipesQuery.data?.categories)
    ? recipesQuery.data.categories
    : [];

  return (
    <>
      <FeaturePageShell
        title="Recipe book"
        description="Recipes linked to checklist tasks so staff can open methods instantly while working."
        actions={pageActions}
      >
        <RecipeFilters
          search={search}
          onSearchChange={setSearch}
          section={section}
          onSectionChange={setSection}
          category={category}
          onCategoryChange={setCategory}
          sections={sections}
          categories={categories}
        />

        {recipesQuery.isFetching ? (
          <div className="rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-sm text-[var(--text-muted)]">Updating recipes...</p>
          </div>
        ) : null}

        <div className="flex flex-wrap items-center gap-3">
          <Badge>{recipes.length} recipes</Badge>
          {section !== "all" ? <Badge>{section}</Badge> : null}
          {category !== "all" ? <Badge>{category}</Badge> : null}
        </div>

        {recipesQuery.isLoading && !recipesQuery.data ? (
          <div className="rounded-[22px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] p-6 text-center">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Loading recipes...
            </p>
          </div>
        ) : recipesQuery.isError ? (
          <ErrorState title="Unable to load recipes" error={recipesQuery.error} />
        ) : recipes.length ? (
          <div className="grid gap-5 lg:grid-cols-2 xl:grid-cols-3">
            {recipes.map((recipe) => (
              <RecipeCard
                key={recipe.id}
                recipe={recipe}
                onOpen={openRecipe}
                onEdit={openEditModal}
                canManage={canManageRecipes}
              />
            ))}
          </div>
        ) : (
          <EmptyState
            title="No recipes found"
            description="No recipe matches the current search or filters."
          >
            {canManageRecipes ? (
              <Button onClick={openCreateModal}>Create first recipe</Button>
            ) : null}
          </EmptyState>
        )}
      </FeaturePageShell>

      <RecipeDetailDrawer
        recipeId={selectedRecipeId}
        open={Boolean(selectedRecipeId)}
        onClose={closeRecipe}
        onEdit={openEditModal}
        canManage={canManageRecipes}
      />

      <RecipeFormModal
        key={
          isFormOpen
            ? editingRecipe?.id ?? (draftRecipe ? `draft-${draftRecipe.title}` : "create")
            : "closed"
        }
        open={isFormOpen}
        onClose={() => {
          setIsFormOpen(false);
          setEditingRecipe(null);
          setDraftRecipe(null);
        }}
        onSaved={(recipe) => {
          if (recipe?.id) {
            openRecipe(recipe.id);
          }
        }}
        recipe={editingRecipe}
        draft={draftRecipe}
        kitchenOptions={kitchenOptions}
      />

      <RecipeScanModal
        open={isScanOpen}
        onClose={() => setIsScanOpen(false)}
        onScanned={(draft) => {
          setDraftRecipe(draft);
          setEditingRecipe(null);
          setIsFormOpen(true);
        }}
      />

      <RecipeDraftsDrawer
        open={isDraftsOpen}
        onClose={() => setIsDraftsOpen(false)}
        kitchens={authMeQuery.data?.accessibleKitchens ?? []}
        canApprove={canApproveDrafts}
      />
    </>
  );
}
