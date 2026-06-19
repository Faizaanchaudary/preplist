import Input from "../../../shared/ui/Input";
import Select from "../../../shared/ui/Select";

export default function RecipeFilters({
  search,
  onSearchChange,
  section,
  onSectionChange,
  category,
  onCategoryChange,
  sections = [],
  categories = [],
}) {
  return (
    <div className="grid gap-3 lg:grid-cols-[1fr_220px_220px]">
      <Input
        value={search}
        onChange={(event) => onSearchChange?.(event.target.value)}
        placeholder="Search recipes, ingredients, or sections"
      />

      <Select
        value={section}
        onChange={(event) => onSectionChange?.(event.target.value)}
        options={[
          { value: "all", label: "All sections" },
          ...sections.map((item) => ({
            value: item,
            label: item,
          })),
        ]}
      />

      <Select
        value={category}
        onChange={(event) => onCategoryChange?.(event.target.value)}
        options={[
          { value: "all", label: "All categories" },
          ...categories.map((item) => ({
            value: item,
            label: item,
          })),
        ]}
      />
    </div>
  );
}