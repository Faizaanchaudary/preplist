import { useQuery } from "@tanstack/react-query";
import {
  getKitchenDetails,
  getKitchens,
} from "../../../api/dataSource";

export function useKitchenManagementQuery() {
  return useQuery({
    queryKey: ["kitchen-management"],
    queryFn: getKitchens,
  });
}

export function useKitchenDetailsQuery(kitchenId) {
  return useQuery({
    queryKey: ["kitchen-management", kitchenId],
    queryFn: () => getKitchenDetails(kitchenId),
    enabled: Boolean(kitchenId),
  });
}
