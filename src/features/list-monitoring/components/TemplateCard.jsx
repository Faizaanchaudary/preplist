import { motion } from "framer-motion";
import Badge from "../../../shared/ui/Badge";
import Button from "../../../shared/ui/Button";
import Card from "../../../shared/ui/Card";

export default function TemplateCard({ template, onApply }) {
  return (
    <motion.div layout initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="p-5 sm:p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              {template.title}
            </h3>
            <p className="mt-1 text-sm text-[var(--text-muted)]">
              Section: {template.section}
            </p>
          </div>

          <Badge>{template.itemCount} items</Badge>
        </div>

        {onApply ? (
          <div className="mt-5">
            <Button variant="secondary" onClick={() => onApply?.(template)}>
              Apply template
            </Button>
          </div>
        ) : null}
      </Card>
    </motion.div>
  );
}
