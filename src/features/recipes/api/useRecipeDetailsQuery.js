import { useQuery } from "@tanstack/react-query";
import { getRecipeDetails } from "../../../api/dataSource";

export function useRecipeDetailsQuery(recipeId) {
  return useQuery({
    queryKey: ["recipes", "details", recipeId],
    queryFn: () => getRecipeDetails(recipeId),
    enabled: Boolean(recipeId),
  });
}
