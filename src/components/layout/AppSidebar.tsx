import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard,
  MessageSquare,
  Camera,
  Brain,
  FileText,
  BookOpen,
  GraduationCap,
  User,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  Menu,
  X,
  HelpCircle,
  CreditCard,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

interface NavItem {
  title: string;
  href: string;
  icon: React.ElementType;
  badge?: string;
}

const navItems: NavItem[] = [
  { title: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { title: "Chat IA", href: "/chat", icon: MessageSquare, badge: "IA" },
  { title: "Snap & Solve", href: "/snap-solve", icon: Camera },
  { title: "Quiz & Flashcards", href: "/quiz", icon: Brain },
  { title: "Notes & Synthèses", href: "/notes", icon: FileText },
  { title: "Cours en BD", href: "/comics", icon: BookOpen },
  { title: "Exam Prep", href: "/exam-prep", icon: GraduationCap },
  { title: "Tarifs", href: "/pricing", icon: CreditCard },
  { title: "Profil", href: "/profile", icon: User },
  { title: "FAQ & Aide", href: "/faq", icon: HelpCircle },
];

interface AppSidebarProps {
  collapsed: boolean;
  onToggle: () => void;
}

export function AppSidebar({ collapsed, onToggle }: AppSidebarProps) {
  const location = useLocation();
  const isMobile = useIsMobile();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebarContent = (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-4 border-b border-border">
        <NavLink to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl prago-gradient-bg flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <AnimatePresence mode="wait">
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="font-display font-bold text-xl overflow-hidden whitespace-nowrap"
              >
                PRAGO
              </motion.span>
            )}
          </AnimatePresence>
        </NavLink>
        {!isMobile && (
          <button
            onClick={onToggle}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? (
              <ChevronRight className="w-4 h-4" />
            ) : (
              <ChevronLeft className="w-4 h-4" />
            )}
          </button>
        )}
        {isMobile && (
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 rounded-lg hover:bg-secondary transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname === item.href;
          return (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => isMobile && setMobileOpen(false)}
              className={cn(
                "prago-sidebar-item relative group",
                isActive && "prago-sidebar-item-active"
              )}
            >
              <item.icon className={cn("w-5 h-5 flex-shrink-0", collapsed && !isMobile && "mx-auto")} />
              <AnimatePresence mode="wait">
                {(!collapsed || isMobile) && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="overflow-hidden whitespace-nowrap text-sm"
                  >
                    {item.title}
                  </motion.span>
                )}
              </AnimatePresence>
              {item.badge && (!collapsed || isMobile) && (
                <span className="ml-auto prago-badge-primary text-[10px]">
                  {item.badge}
                </span>
              )}
              {/* Tooltip for collapsed state */}
              {collapsed && !isMobile && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-foreground text-background text-xs rounded-md opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
                  {item.title}
                </div>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border">
        <div
          className={cn(
            "prago-card p-3 bg-primary/5",
            collapsed && !isMobile && "p-2"
          )}
        >
          {(!collapsed || isMobile) && (
            <div className="mb-2">
              <p className="text-xs font-medium text-foreground">Plan Gratuit</p>
              <p className="text-[10px] text-muted-foreground">5/10 requêtes IA</p>
            </div>
          )}
          <div className="prago-progress">
            <div className="prago-progress-bar" style={{ width: "50%" }} />
          </div>
        </div>
      </div>
    </div>
  );

  // Mobile: Drawer
  if (isMobile) {
    return (
      <>
        {/* Mobile trigger in header */}
        <button
          onClick={() => setMobileOpen(true)}
          className="lg:hidden fixed top-4 left-4 z-50 p-2 rounded-xl bg-card border border-border shadow-prago"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Overlay */}
        <AnimatePresence>
          {mobileOpen && (
            <>
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileOpen(false)}
                className="fixed inset-0 bg-background/80 backdrop-blur-sm z-40"
              />
              <motion.aside
                initial={{ x: "-100%" }}
                animate={{ x: 0 }}
                exit={{ x: "-100%" }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="fixed left-0 top-0 h-screen w-[280px] bg-card border-r border-border z-50"
              >
                {sidebarContent}
              </motion.aside>
            </>
          )}
        </AnimatePresence>
      </>
    );
  }

  // Desktop: Fixed sidebar
  return (
    <aside
      className={cn(
        "prago-sidebar hidden lg:block",
        collapsed && "prago-sidebar-collapsed"
      )}
    >
      {sidebarContent}
    </aside>
  );
}
