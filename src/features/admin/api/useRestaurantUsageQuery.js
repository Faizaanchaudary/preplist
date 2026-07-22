import { useQuery } from "@tanstack/react-query";
import { getRestaurantUsageOverview } from "../../../api/dataSource";

export function useRestaurantUsageQuery() {
  return useQuery({
    queryKey: ["admin", "restaurant-usage"],
    queryFn: getRestaurantUsageOverview,
  });
}
