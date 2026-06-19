import { useMemo, useState } from "react";
import ErrorState from "../../../shared/ui/ErrorState";
import FeaturePageShell from "../../../shared/ui/FeaturePageShell";
import PageLoader from "../../../shared/ui/PageLoader";
import ActivityFilters from "../components/ActivityFilters";
import ActivityLogTable from "../components/ActivityLogTable";
import ActivityTimeline from "../components/ActivityTimeline";
import CarryForwardSnapshot from "../components/CarryForwardSnapshot";
import DailyHistoryPanel from "../components/DailyHistoryPanel";
import PhotoReviewDrawer from "../components/PhotoReviewDrawer";
import WeeklyHistoryPanel from "../components/WeeklyHistoryPanel";
import {
  useActivityLogsQuery,
  useCarryForwardSnapshotsQuery,
  useDailyHistoryQuery,
  useWeeklyHistoryQuery,
} from "../api/useActivityLogsQuery";

export default function ActivityLogsPage() {
  const [view, setView] = useState("timeline");
  const [actionFilter, setActionFilter] = useState("all");
  const [proofFilter, setProofFilter] = useState("all");
  const [selectedEntry, setSelectedEntry] = useState(null);

  const logsQuery = useActivityLogsQuery({ action: actionFilter });
  const dailyQuery = useDailyHistoryQuery();
  const weeklyQuery = useWeeklyHistoryQuery();
  const snapshotsQuery = useCarryForwardSnapshotsQuery();

  const isInitialLoading =
    (logsQuery.isLoading && !logsQuery.data) ||
    (dailyQuery.isLoading && !dailyQuery.data) ||
    (weeklyQuery.isLoading && !weeklyQuery.data) ||
    (snapshotsQuery.isLoading && !snapshotsQuery.data);

  const isError =
    logsQuery.isError ||
    dailyQuery.isError ||
    weeklyQuery.isError ||
    snapshotsQuery.isError;

  const error =
    logsQuery.error ??
    dailyQuery.error ??
    weeklyQuery.error ??
    snapshotsQuery.error;

  const logs = useMemo(() => {
    return Array.isArray(logsQuery.data?.rows) ? logsQuery.data.rows : [];
  }, [logsQuery.data]);

  const dailyRows = useMemo(() => {
    const rows = Array.isArray(dailyQuery.data?.rows) ? dailyQuery.data.rows : [];

    if (proofFilter === "with_photo") {
      return rows.filter((row) => row.hasPhoto);
    }

    if (proofFilter === "without_photo") {
      return rows.filter((row) => !row.hasPhoto);
    }

    return rows;
  }, [dailyQuery.data, proofFilter]);

  const weeklyRows = useMemo(() => {
    return Array.isArray(weeklyQuery.data?.rows) ? weeklyQuery.data.rows : [];
  }, [weeklyQuery.data]);

  const snapshots = useMemo(() => {
    return Array.isArray(snapshotsQuery.data?.rows)
      ? snapshotsQuery.data.rows
      : [];
  }, [snapshotsQuery.data]);

  function handleViewChange(nextView) {
    setView(nextView);

    if (nextView !== "timeline") {
      setActionFilter("all");
    }

    if (nextView !== "daily") {
      setProofFilter("all");
    }
  }

  if (isInitialLoading) {
    return <PageLoader />;
  }

  if (isError) {
    return (
      <FeaturePageShell
        title="Activity logs"
        description="Timeline events, carry-forward snapshots, and daily/weekly history grouped into one operational history area."
      >
        <ErrorState title="Unable to load activity logs" error={error} />
      </FeaturePageShell>
    );
  }

  return (
    <>
      <FeaturePageShell
        title="Activity logs"
        description="Timeline events, carry-forward snapshots, and daily/weekly history grouped into one operational history area."
      >
        <ActivityFilters
          view={view}
          onViewChange={handleViewChange}
          actionFilter={actionFilter}
          onActionFilterChange={setActionFilter}
          proofFilter={proofFilter}
          onProofFilterChange={setProofFilter}
        />

        {view === "timeline" ? (
          <>
            {logsQuery.isFetching ? (
              <div className="rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] px-4 py-3">
                <p className="text-sm text-[var(--text-muted)]">Updating timeline...</p>
              </div>
            ) : null}

            <div className="grid gap-5 xl:grid-cols-[0.92fr_1.08fr]">
              <ActivityTimeline logs={logs} />
              <ActivityLogTable rows={logs} />
            </div>
          </>
        ) : null}

        {view === "daily" ? (
          <DailyHistoryPanel
            rows={dailyRows}
            onPreviewPhoto={(entry) => setSelectedEntry(entry)}
          />
        ) : null}

        {view === "weekly" ? <WeeklyHistoryPanel rows={weeklyRows} /> : null}

        {view === "snapshots" ? (
          <CarryForwardSnapshot rows={snapshots} />
        ) : null}
      </FeaturePageShell>

      <PhotoReviewDrawer
        open={Boolean(selectedEntry)}
        entry={selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </>
  );
}