import { useState } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  DollarSign,
  FolderTree,
  Receipt,
  FileText,
  Settings,
  Menu,
  X
} from "lucide-react";
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

const Sidebar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <div className={cn(
      "border-r bg-background transition-all duration-300",
      collapsed ? "w-14" : "w-64"
    )}>
      <div className="flex items-center justify-between p-4">
        {!collapsed && (
          <h2 className="text-lg font-semibold">Menu</h2>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setCollapsed(!collapsed)}
        >
          {collapsed ? <Menu className="h-4 w-4" /> : <X className="h-4 w-4" />}
        </Button>
      </div>

      <nav className="space-y-1 p-2">
        {sidebarItems.map((item) => (
          <NavLink
            key={item.title}
            to={item.url}
            className={cn(
              "flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive(item.url)
                ? "bg-secondary text-secondary-foreground"
                : "text-muted-foreground hover:bg-secondary/50 hover:text-secondary-foreground"
            )}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            {!collapsed && (
              <span className="ml-3">{item.title}</span>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  );
};

export default Sidebar;