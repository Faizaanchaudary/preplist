import { useQuery } from "@tanstack/react-query";
import { getDashboardData } from "../../../api/dataSource";

export function useDashboardQuery() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: getDashboardData,
  });
}
