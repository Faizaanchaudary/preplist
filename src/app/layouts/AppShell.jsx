import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Topbar from "./Topbar";
import { cn } from "../../shared/utils/cn";
import useSidebarStore from "../../store/useSidebarStore";

export default function AppShell() {
  const isExpanded = useSidebarStore((state) => state.isExpanded);

  return (
    <div className="min-h-screen bg-[var(--app-bg)]">
      <Sidebar />

      <div
        className={cn(
          "min-h-screen transition-[padding] duration-300 ease-out",
          isExpanded ? "lg:pl-[248px]" : "lg:pl-[88px]"
        )}
      >
        <Topbar />

        <main className="px-4 py-5 sm:px-6 lg:px-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}