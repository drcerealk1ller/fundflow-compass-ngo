import { useState, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  DollarSign,
  FolderTree,
  Receipt,
  FileText,
  Settings,
  Menu,
  X,
  Users,
  Calculator
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const sidebarItems = [
  { title: "Dashboard", url: "/", icon: Home },
  { title: "Funding", url: "/funding", icon: DollarSign },
  { title: "Projects", url: "/projects", icon: FolderTree },
  { title: "Expenses", url: "/expenses", icon: Receipt },
  { title: "Reports", url: "/reports", icon: FileText },
  { title: "Settings", url: "/settings", icon: Settings },
];

const adminItems = [
  { title: "User Management", url: "/user-management", icon: Users },
];

const financeItems = [
  
];

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const [userRole, setUserRole] = useState<string>('staff');
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', user.id)
          .single();
        
        if (data) {
          setUserRole(data.role);
        }
      }
    };

    fetchUserRole();
  }, [user]);

  const isActive = (path: string) => location.pathname === path;
  const isAdmin = userRole === 'admin';
  const isFinanceUser = ['admin', 'finance_manager'].includes(userRole);

  return (
    <div className={cn(
      "border-r bg-gradient-to-b from-card to-card/80 backdrop-blur-sm transition-all duration-300 shadow-lg",
      collapsed ? "w-14" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-primary/10 to-accent/10">
        {!collapsed && (
          <h2 className="text-lg font-semibold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Menu
          </h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
          className="hover:bg-primary/10 hover:text-primary"
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="space-y-2 p-4">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={cn(
              "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
              isActive(item.url)
                ? "bg-gradient-to-r from-primary to-accent text-white shadow-lg transform scale-105"
                : "text-muted-foreground hover:bg-gradient-to-r hover:from-primary/20 hover:to-accent/20 hover:text-foreground hover:scale-105 hover:shadow-md"
            )}
          >
            <div className={cn(
              "absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
              !isActive(item.url) && "group-hover:opacity-100"
            )} />
            <item.icon className={cn(
              "h-5 w-5 shrink-0 relative z-10",
              isActive(item.url) ? "text-white" : "group-hover:text-primary"
            )} />
            {!collapsed && (
              <span className="ml-3 relative z-10">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>

      {/* Finance Section */}
      {isFinanceUser && (
        <div className="border-t border-border/50">
          {!collapsed && (
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Finance
              </h3>
            </div>
          )}
          <nav className="space-y-2 p-4 pt-2">
            {financeItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={cn(
                  "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive(item.url)
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg transform scale-105"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-emerald-500/20 hover:to-teal-500/20 hover:text-foreground hover:scale-105 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-emerald-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  !isActive(item.url) && "group-hover:opacity-100"
                )} />
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 relative z-10",
                  isActive(item.url) ? "text-white" : "group-hover:text-emerald-500"
                )} />
                {!collapsed && (
                  <span className="ml-3 relative z-10">{item.title}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      )}

      {/* Admin Section */}
      {isAdmin && (
        <div className="border-t border-border/50">
          {!collapsed && (
            <div className="px-4 py-2">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Administration
              </h3>
            </div>
          )}
          <nav className="space-y-2 p-4 pt-2">
            {adminItems.map((item) => (
              <NavLink
                key={item.title}
                to={item.url}
                className={cn(
                  "flex items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 group relative overflow-hidden",
                  isActive(item.url)
                    ? "bg-gradient-to-r from-rose-500 to-pink-500 text-white shadow-lg transform scale-105"
                    : "text-muted-foreground hover:bg-gradient-to-r hover:from-rose-500/20 hover:to-pink-500/20 hover:text-foreground hover:scale-105 hover:shadow-md"
                )}
              >
                <div className={cn(
                  "absolute inset-0 bg-gradient-to-r from-rose-500/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
                  !isActive(item.url) && "group-hover:opacity-100"
                )} />
                <item.icon className={cn(
                  "h-5 w-5 shrink-0 relative z-10",
                  isActive(item.url) ? "text-white" : "group-hover:text-rose-500"
                )} />
                {!collapsed && (
                  <span className="ml-3 relative z-10">{item.title}</span>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      )}
    </div>
  );
};

export default Sidebar;