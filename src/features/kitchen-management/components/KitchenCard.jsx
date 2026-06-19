import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import { ROUTES } from "../../../shared/constants/routes";

export default function KitchenCard({
  kitchen,
  sectionCount,
  memberCount,
  codeCount,
}) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 sm:p-6">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {kitchen.name}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              {kitchen.city} · {kitchen.siteCode}
            </p>
          </div>

          <Badge variant="dark">{memberCount} members</Badge>
        </div>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Sections
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {sectionCount}
            </p>
          </div>

          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Active lists
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {Array.isArray(kitchen.activeListIds) ? kitchen.activeListIds.length : 0}
            </p>
          </div>

          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Access codes
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {codeCount}
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Link to={`${ROUTES.KITCHEN_MANAGEMENT}/${kitchen.id}`}>
            <Button variant="secondary">View kitchen details</Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
