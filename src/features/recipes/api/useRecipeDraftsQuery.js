import { useQuery } from "@tanstack/react-query";
import { getRecipeDrafts } from "../../../api/dataSource";

export function useRecipeDraftsQuery(filters = {}, options = {}) {
  return useQuery({
    queryKey: ["recipes", "drafts", filters],
    queryFn: () => getRecipeDrafts(filters),
    ...options,
  });
}
