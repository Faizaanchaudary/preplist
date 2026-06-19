import { useQuery } from "@tanstack/react-query";
import { getUsers } from "../../../api/dataSource";

export function useUsersQuery(filters = {}) {
  return useQuery({
    queryKey: ["users", "list", filters],
    queryFn: () => getUsers(filters),
    placeholderData: (previousData) => previousData,
  });
}

