import { cn } from "@/utils/cn";
import { type ReactNode } from "react";

interface SidebarProps {
  children: ReactNode;
  isOpen?: boolean;
  isCollapsed?: boolean;
}

export function Sidebar({
  children,
  isOpen = true,
  isCollapsed = false,
}: SidebarProps) {
  return (
    <aside
      className={cn(
        "fixed left-0 top-0 h-screen bg-primary text-white transition-all duration-300 ease-in-out",
        isCollapsed ? "w-20" : "w-64",
        !isOpen && "-translate-x-full md:translate-x-0",
      )}
    >
      <nav className="flex flex-col h-full">{children}</nav>
    </aside>
  );
}

export default Sidebar;
