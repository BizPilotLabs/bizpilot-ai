import {
  Activity,
  Bot,
  Building2,
  FolderKanban,
  LayoutDashboard,
  Settings,
  ShieldCheck,
  SquareCheckBig,
  Users,
  UsersRound,
  type LucideIcon
} from "lucide-react";

export interface NavigationItem {
  label: string;
  href: string;
  icon: LucideIcon;
  permission?: string;
  children?: NavigationItem[];
}

export const appNavigation: NavigationItem[] = [
  { label: "Dashboard", href: "/app/dashboard", icon: LayoutDashboard },
  { label: "Projects", href: "/app/projects", icon: FolderKanban },
  { label: "Tasks", href: "/app/tasks", icon: SquareCheckBig },
  { label: "Teams", href: "/app/teams", icon: UsersRound },
  { label: "Users", href: "/app/users", icon: Users },
  { label: "Roles", href: "/app/roles", icon: ShieldCheck, permission: "roles.read" },
  { label: "Organizations", href: "/app/organizations", icon: Building2 },
  { label: "Activity", href: "/app/activity", icon: Activity, permission: "activities.read" },
  { label: "AI Copilot", href: "/app/ai", icon: Bot, permission: "ai.use" },
  { label: "Settings", href: "/app/settings", icon: Settings }
];

export const findNavigationItem = (pathname: string, items: NavigationItem[] = appNavigation): NavigationItem | undefined => {
  const visit = (navigationItems: NavigationItem[]): NavigationItem | undefined => {
    for (const item of navigationItems) {
      if (pathname === item.href || pathname.startsWith(`${item.href}/`)) {
        return item;
      }

      const child = item.children ? visit(item.children) : undefined;
      if (child) {
        return child;
      }
    }

    return undefined;
  };

  return visit(items);
};
