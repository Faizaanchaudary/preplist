import Table from "../../../shared/ui/Table";
import { formatDate } from "../../../shared/utils/formatDate";
import { formatTime } from "../../../shared/utils/formatTime";

export default function ActivityLogTable({ rows = [] }) {
  return (
    <Table
      columns={[
        {
          key: "actor",
          label: "Actor",
          render: (row) => row.actor ?? "—",
        },
        {
          key: "action",
          label: "Action",
          render: (row) => row.action?.replace(/\b\w/g, (char) => char.toUpperCase()) ?? "—",
        },
        {
          key: "message",
          label: "Message",
        },
        {
          key: "createdAt",
          label: "Time",
          render: (row) => `${formatDate(row.createdAt)} · ${formatTime(row.createdAt)}`,
        },
      ]}
      rows={rows}
    />
  );
}