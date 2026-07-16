/**
 * React Query hooks for activity-log feature.
 *
 * Extends the existing activity query with:
 *   - useActivityCategoriesQuery — for mobile tab-bar filter options
 *   - useMonthlyHistoryQuery     — for mobile History screen month navigator
 *   - useCompleteActivityLogMutation — mark a task complete
 */
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getActivityCategories,
  getActivityLogs,
  getCarryForwardSnapshots,
  getDailyHistory,
  getMonthlyHistory,
  getWeeklyHistory,
  completeActivityLog,
} from "../../../api/dataSource";

// ---------------------------------------------------------------------------
// Query hooks
// ---------------------------------------------------------------------------

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

/**
 * Monthly history — for the mobile History screen.
 *
 * @param {{ month: number, year: number }} params
 */
export function useMonthlyHistoryQuery({ month, year } = {}) {
  return useQuery({
    queryKey: ["activity-logs", "monthly-history", { month, year }],
    queryFn: () => getMonthlyHistory({ month, year }),
    enabled: Boolean(month && year),
    placeholderData: (previousData) => previousData,
  });
}

export function useCarryForwardSnapshotsQuery() {
  return useQuery({
    queryKey: ["activity-logs", "snapshots"],
    queryFn: getCarryForwardSnapshots,
  });
}

/**
 * Activity category options — for the mobile Activity screen tab-bar.
 * Cached for 10 minutes (categories change rarely).
 */
export function useActivityCategoriesQuery() {
  return useQuery({
    queryKey: ["categories", "activity"],
    queryFn: getActivityCategories,
    staleTime: 10 * 60 * 1000,
  });
}

// ---------------------------------------------------------------------------
// Mutation hooks
// ---------------------------------------------------------------------------

/**
 * Mark an activity log as completed.
 * Invalidates the activity-logs query so the list refreshes automatically.
 */
export function useCompleteActivityLogMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (logId) => completeActivityLog(logId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["activity-logs"] });
    },
  });
}
