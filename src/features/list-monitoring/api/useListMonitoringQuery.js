import { useQuery } from "@tanstack/react-query";
import {
  getListDetails,
  getPrepLists,
  getTemplates,
} from "../../../api/dataSource";

export function useListMonitoringQuery(query = {}) {
  return useQuery({
    queryKey: ["list-monitoring", query],
    queryFn: () => getPrepLists(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useListDetailsQuery(listId) {
  return useQuery({
    queryKey: ["list-monitoring", listId],
    queryFn: () => getListDetails(listId),
    enabled: Boolean(listId),
    placeholderData: (previousData) => previousData,
  });
}

export function useTemplatesQuery() {
  return useQuery({
    queryKey: ["list-monitoring", "templates"],
    queryFn: getTemplates,
    placeholderData: (previousData) => previousData,
  });
}
