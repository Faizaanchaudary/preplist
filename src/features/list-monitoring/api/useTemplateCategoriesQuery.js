/**
 * React Query hook for template categories data.
 *
 * Usage in TemplateFormModal:
 *   const { data } = useTemplateCategoriesQuery();
 *   const options = data?.rows.map(c => ({ value: c.id, label: c.name })) ?? [];
 */
import { useQuery } from "@tanstack/react-query";
import { getTemplateCategories } from "../../../api/dataSource";

export function useTemplateCategoriesQuery() {
  return useQuery({
    queryKey: ["categories", "template"],
    queryFn: getTemplateCategories,
    // Categories change rarely — cache for 10 minutes
    staleTime: 10 * 60 * 1000,
  });
}
