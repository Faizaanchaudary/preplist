import Tabs from "../../../shared/ui/Tabs";

export default function UserCompanyTabs({
  companies = [],
  value,
  onChange,
  className,
}) {
  const safeCompanies = Array.isArray(companies) ? companies : [];

  const items = [
    { value: "all", label: "All Companies" },
    ...safeCompanies.map((company) => ({
      value: company.id,
      label: company.name,
    })),
  ];

  return (
    <Tabs
      items={items}
      value={value}
      onChange={onChange}
      className={className}
    />
  );
}

