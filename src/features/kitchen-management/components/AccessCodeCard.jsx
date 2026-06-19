import Card from "../../../shared/ui/Card";
import { formatDate } from "../../../shared/utils/formatDate";

export default function AccessCodeCard({ code }) {
  return (
    <Card className="p-4">
      <p className="text-sm font-semibold tracking-[0.12em] text-[var(--text-primary)]">
        {code.code}
      </p>
      <p className="mt-1 text-xs text-[var(--text-muted)]">
        {code.expiresAt ? `Expires ${formatDate(code.expiresAt)}` : "No expiry set"}
      </p>
    </Card>
  );
}