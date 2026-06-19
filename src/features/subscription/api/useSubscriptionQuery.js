import { useQuery } from "@tanstack/react-query";
import {
  getRestaurantSubscriptionUsage,
  getSubscriptionPlans,
} from "../../../api/dataSource";

export function useSubscriptionPlansQuery() {
  return useQuery({
    queryKey: ["subscription", "plans"],
    queryFn: () => getSubscriptionPlans(),
  });
}

export function useRestaurantSubscriptionUsageQuery() {
  return useQuery({
    queryKey: ["subscription", "restaurant-usage"],
    queryFn: () => getRestaurantSubscriptionUsage(),
  });
}
