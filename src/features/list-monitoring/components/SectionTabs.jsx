import Tabs from "../../../shared/ui/Tabs";

export default function SectionTabs({
  sections = [],
  value,
  onChange,
}) {
  const items = [
    { value: "all", label: "All sections" },
    ...sections.map((section) => ({
      value: section,
      label: section,
    })),
  ];

  return <Tabs items={items} value={value} onChange={onChange} />;
}