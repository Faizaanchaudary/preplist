import { useQuery } from "@tanstack/react-query";
import {
  getOrganizationOverview,
  getOrganizationUsers,
} from "../../../api/dataSource";

export function useOrganizationOverviewQuery(filters = {}) {
  return useQuery({
    queryKey: ["organization", "overview", filters],
    queryFn: () => getOrganizationOverview(filters),
  });
}

export function useOrganizationUsersQuery(filters = {}) {
  return useQuery({
    queryKey: ["organization", "users", filters],
    queryFn: () => getOrganizationUsers(filters),
  });
}
