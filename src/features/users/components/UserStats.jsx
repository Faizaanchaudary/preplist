import StatCard from "../../../shared/ui/StatCard";

export default function UserStats({ stats = [] }) {
  const safeStats = Array.isArray(stats) ? stats : [];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
      {safeStats.map((stat) => (
        <StatCard key={stat.label} {...stat} />
      ))}
    </div>
  );
}
