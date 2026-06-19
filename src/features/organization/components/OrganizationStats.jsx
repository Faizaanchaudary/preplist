import StatCard from "../../../shared/ui/StatCard";

export default function OrganizationStats({ stats = [] }) {
  const rows = Array.isArray(stats) ? stats : [];

  return (
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      {rows.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}

