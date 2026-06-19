import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";
import ProgressBar from "../../../shared/ui/ProgressBar";
import { ROUTES } from "../../../shared/constants/routes";
import ListHeader from "./ListHeader";
// import useAuthStore from "../../../store/useAuthStore";

export default function ListCard({
  list,
  kitchenName,
  accessCode,
  totalItems,
  completedItems,
}) {
  // const currentUser = useAuthStore((state) => state.currentUser);
  // const isCreator = currentUser?.id && list?.createdBy === currentUser.id;

  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 sm:p-6">
        <ListHeader
          title={list.title}
          section={`${kitchenName} · ${list.section}`}
          accessCode={accessCode}
          active={list.isActive}
        />

        {/* {isCreator && accessCode ? (
          <div className="mt-4 rounded-[18px] border border-[var(--stroke-soft)] bg-[var(--surface-soft)] px-4 py-3">
            <p className="text-sm text-[var(--text-muted)]">
              Access code sent to{" "}
              <span className="font-medium text-[var(--text-primary)]">
                {currentUser.email}
              </span>
              .
            </p>
          </div>
        ) : null} */}

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Items
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {totalItems}
            </p>
          </div>

          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Checked
            </p>
            <p className="mt-2 text-2xl font-semibold text-[var(--text-primary)]">
              {completedItems}
            </p>
          </div>

          <div className="rounded-[18px] bg-[var(--surface-soft)] p-4">
            <p className="text-xs uppercase tracking-[0.08em] text-[var(--text-muted)]">
              Carry-forward
            </p>
            <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
              Preserved snapshot ready
            </p>
          </div>
        </div>

        <div className="mt-5">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Completion progress
            </p>
            <Badge>{completedItems}/{totalItems || 0}</Badge>
          </div>
          <ProgressBar value={completedItems} max={totalItems || 1} />
        </div>

        <div className="mt-5 flex flex-wrap items-center gap-3">
          <Link to={`${ROUTES.LIST_MONITORING}/${list.id}`}>
            <Button variant="secondary">Open details</Button>
          </Link>
        </div>
      </Card>
    </motion.div>
  );
}
