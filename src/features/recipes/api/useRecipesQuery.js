import { useQuery } from "@tanstack/react-query";
import { getRecipes } from "../../../api/dataSource";

export function useRecipesQuery(filters = {}) {
  const search = typeof filters.search === "string" ? filters.search : "";
  const section = typeof filters.section === "string" ? filters.section : "all";
  const category =
    typeof filters.category === "string" ? filters.category : "all";

  return useQuery({
    queryKey: ["recipes", search, section, category],
    queryFn: () =>
      getRecipes({
        search,
        section,
        category,
      }),
    placeholderData: (previousData) => previousData,
  });
}
