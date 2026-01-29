import { Bell, Search, Moon, Sun } from "lucide-react";
import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

interface AppHeaderProps {
  sidebarCollapsed: boolean;
}

export function AppHeader({ sidebarCollapsed }: AppHeaderProps) {
  const [isDark, setIsDark] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  useEffect(() => {
    const isDarkMode = document.documentElement.classList.contains("dark");
    setIsDark(isDarkMode);
  }, []);

  const toggleTheme = () => {
    const newIsDark = !isDark;
    setIsDark(newIsDark);
    document.documentElement.classList.toggle("dark", newIsDark);
  };

  return (
    <header
      className={cn(
        "fixed top-0 right-0 h-16 bg-background/80 backdrop-blur-md border-b border-border z-30 transition-all duration-300",
        "left-0 lg:left-[var(--sidebar-width)]",
        sidebarCollapsed && "lg:left-[var(--sidebar-width-collapsed)]"
      )}
    >
      <div className="h-full flex items-center justify-between px-4 lg:px-6">
        {/* Search */}
        <div className="flex-1 max-w-md hidden sm:block">
          <div
            className={cn(
              "relative transition-all duration-200",
              searchFocused && "scale-[1.02]"
            )}
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Rechercher..."
              onFocus={() => setSearchFocused(true)}
              onBlur={() => setSearchFocused(false)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-secondary/50 border border-transparent focus:border-primary/30 focus:bg-secondary text-sm placeholder:text-muted-foreground outline-none transition-all"
            />
            <kbd className="absolute right-3 top-1/2 -translate-y-1/2 px-2 py-0.5 text-[10px] font-medium text-muted-foreground bg-background rounded border border-border hidden md:block">
              ⌘K
            </kbd>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 ml-auto">
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-2.5 rounded-xl hover:bg-secondary transition-colors"
            aria-label="Toggle theme"
          >
            {isDark ? (
              <Sun className="w-5 h-5" />
            ) : (
              <Moon className="w-5 h-5" />
            )}
          </button>

          {/* Notifications */}
          <button
            className="relative p-2.5 rounded-xl hover:bg-secondary transition-colors"
            aria-label="Notifications"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-2 right-2 w-2 h-2 rounded-full bg-primary" />
          </button>

          {/* User Avatar */}
          <button className="w-9 h-9 rounded-xl prago-gradient-bg flex items-center justify-center text-white font-bold text-sm ml-1 shadow-prago-sm hover:shadow-prago transition-shadow">
            JD
          </button>
        </div>
      </div>
    </header>
  );
}
