import { useState } from "react";
import { Outlet } from "react-router-dom";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

export function AppLayout() {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  return (
    <div className="min-h-screen bg-background">
      <AppSidebar
        collapsed={sidebarCollapsed}
        onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
      />
      <AppHeader sidebarCollapsed={sidebarCollapsed} />
      
      <main
        className={cn(
          "pt-16 min-h-screen transition-all duration-300",
          !isMobile && "lg:pl-[var(--sidebar-width)]",
          !isMobile && sidebarCollapsed && "lg:pl-[var(--sidebar-width-collapsed)]"
        )}
      >
        <div className="p-4 lg:p-6">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
