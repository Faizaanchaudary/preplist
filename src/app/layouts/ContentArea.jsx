import { cn } from "../../shared/utils/cn";
import useSidebarStore from "../../store/useSidebarStore";
import Topbar from "./Topbar";

export default function ContentArea({ children }) {
  const isExpanded = useSidebarStore((state) => state.isExpanded);

  return (
    <div
      className={cn(
        "min-h-screen transition-[padding-left] duration-300 ease-out",
        isExpanded ? "pl-[248px]" : "pl-[88px]"
      )}
    >
      <Topbar />
      <main className="px-4 pb-8 pt-5 sm:px-6 lg:px-8">{children}</main>
    </div>
  );
}