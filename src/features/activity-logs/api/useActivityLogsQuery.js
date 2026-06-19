import { useQuery } from "@tanstack/react-query";
import {
  getActivityLogs,
  getCarryForwardSnapshots,
  getDailyHistory,
  getWeeklyHistory,
} from "../../../api/dataSource";

export function useActivityLogsQuery(query = {}) {
  return useQuery({
    queryKey: ["activity-logs", query],
    queryFn: () => getActivityLogs(query),
    placeholderData: (previousData) => previousData,
  });
}

export function useDailyHistoryQuery() {
  return useQuery({
    queryKey: ["activity-logs", "daily-history"],
    queryFn: getDailyHistory,
  });
}

export function useWeeklyHistoryQuery() {
  return useQuery({
    queryKey: ["activity-logs", "weekly-history"],
    queryFn: getWeeklyHistory,
  });
}

export function useCarryForwardSnapshotsQuery() {
  return useQuery({
    queryKey: ["activity-logs", "snapshots"],
    queryFn: getCarryForwardSnapshots,
  });
}
