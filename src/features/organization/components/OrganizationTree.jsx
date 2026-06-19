import CompanyCard from "./CompanyCard";

export default function OrganizationTree({ tree }) {
  const companies = Array.isArray(tree?.companies) ? tree.companies : [];

  return (
    <div className="space-y-5">
      {companies.map((company) => (
        <CompanyCard key={company.id} company={company} />
      ))}
    </div>
  );
}

