import Badge from "../../../shared/ui/Badge";
import Card from "../../../shared/ui/Card";

export default function KitchenSectionsCard({ sections = [] }) {
  return (
    <Card className="p-5 sm:p-6">
      <h3 className="text-lg font-semibold text-[var(--text-primary)]">
        Sections
      </h3>

      <div className="mt-5 flex flex-wrap gap-2">
        {sections.map((section) => (
          <Badge key={section.id}>{section.name}</Badge>
        ))}
      </div>
    </Card>
  );
}