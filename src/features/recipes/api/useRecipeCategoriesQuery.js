/**
 * React Query hooks for recipe category data.
 *
 * Usage in RecipeFormModal:
 *   const { data } = useRecipeCategoriesQuery();
 *   const options = data?.rows.map(c => ({ value: c.id, label: c.name })) ?? [];
 */
import { useQuery } from "@tanstack/react-query";
import { getRecipeCategories } from "../../../api/dataSource";

export function useRecipeCategoriesQuery() {
  return useQuery({
    queryKey: ["categories", "recipe"],
    queryFn: getRecipeCategories,
    // Categories rarely change — cache for 10 minutes
    staleTime: 10 * 60 * 1000,
  });
}
