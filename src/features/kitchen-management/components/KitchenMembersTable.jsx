import Table from "../../../shared/ui/Table";

export default function KitchenMembersTable({ rows = [] }) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return (
    <Table
      rows={safeRows}
      emptyMessage="No kitchen members are available."
      columns={[
        {
          key: "name",
          label: "User",
          render: (row) => (
            <div className="min-w-[120px]">
              <span className="font-medium">{row?.name ?? "—"}</span>
            </div>
          ),
        },
        { key: "role", label: "Role" },
        {
          key: "email",
          label: "Email",
          render: (row) => (
            <div className="min-w-[180px] break-all">
              {row?.email ?? "—"}
            </div>
          ),
        },
        {
          key: "workingSection",
          label: "Working section",
          render: (row) => row?.workingSection ?? "—",
        },
        {
          key: "assignedSections",
          label: "Assigned sections",
          render: (row) =>
            Array.isArray(row?.assignedSections) && row.assignedSections.length
              ? row.assignedSections.join(", ")
              : "—",
        },
        {
          key: "activeTasks",
          label: "Active tasks",
          render: (row) => row?.activeTasks ?? 0,
        },
        {
          key: "joinedViaCode",
          label: "Joined via code",
          render: (row) => (row?.joinedViaCode ? "Yes" : "No"),
        },
      ]}
    />
  );
}