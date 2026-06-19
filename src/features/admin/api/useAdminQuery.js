import { useQuery } from "@tanstack/react-query";
import { getAdminRoles } from "../../../api/dataSource";

export function useAdminRolesQuery() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: getAdminRoles,
  });
}
