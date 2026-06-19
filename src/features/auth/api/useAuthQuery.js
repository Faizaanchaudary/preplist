import { useQuery } from "@tanstack/react-query";
import { getCurrentSession } from "../../../api/dataSource";

export function useAuthMeQuery() {
  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: getCurrentSession,
    retry: 0,
    staleTime: 60_000,
    gcTime: 5 * 60_000,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
    refetchOnMount: true,
  });
}
