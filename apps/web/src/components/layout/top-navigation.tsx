import { Bell, LogOut, Menu, Moon, Search, Settings, Sun, User } from "lucide-react";
import { useMemo, type ReactElement } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { findNavigationItem } from "./navigation";
import { Avatar, Breadcrumb, Button, Dropdown, DropdownButton, DropdownLink, Input, Tooltip } from "@/components/ui";
import { useLogout } from "@/features/auth";
import { useTheme } from "@/hooks";
import { routePaths } from "@/routes";
import { useAuthStore } from "@/store";

export interface TopNavigationProps {
  onMobileMenuOpen: () => void;
}

export function TopNavigation({ onMobileMenuOpen }: TopNavigationProps): ReactElement {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, setTheme } = useTheme();
  const logout = useLogout();
  const user = useAuthStore((state) => state.user);
  const organization = useAuthStore((state) => state.organization);
  const activeItem = findNavigationItem(location.pathname);
  const pageTitle = activeItem?.label ?? "Application";
  const displayName = user ? `${user.firstName} ${user.lastName}` : "Account";
  const breadcrumbItems = useMemo(() => [{ label: organization?.name ?? "Workspace", href: routePaths.app }, { label: pageTitle }], [organization?.name, pageTitle]);

  const handleLogout = async (): Promise<void> => {
    await logout.mutateAsync();
    navigate(routePaths.login, { replace: true });
  };

  return (
    <header className="sticky top-0 z-30 border-b border-border bg-background/90 backdrop-blur-xl">
      <div className="flex h-16 items-center gap-3 px-4 sm:px-6">
        <Button aria-label="Open navigation menu" className="lg:hidden" size="icon" variant="ghost" onClick={onMobileMenuOpen}>
          <Menu aria-hidden="true" className="h-5 w-5" />
        </Button>
        <div className="min-w-0 flex-1">
          <div className="hidden sm:block">
            <Breadcrumb items={breadcrumbItems} />
          </div>
          <h1 className="truncate text-lg font-semibold text-foreground">{pageTitle}</h1>
        </div>
        <div className="hidden w-full max-w-xs md:block">
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 z-10 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input aria-label="Search" className="pl-9" placeholder="Search" type="search" />
          </div>
        </div>
        <Tooltip content={theme === "dark" ? "Use light mode" : "Use dark mode"}>
          <Button aria-label="Toggle theme" size="icon" variant="ghost" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
            {theme === "dark" ? <Sun aria-hidden="true" className="h-4 w-4" /> : <Moon aria-hidden="true" className="h-4 w-4" />}
          </Button>
        </Tooltip>
        <Tooltip content="Notifications">
          <Button aria-label="Notifications" size="icon" variant="ghost">
            <Bell aria-hidden="true" className="h-4 w-4" />
          </Button>
        </Tooltip>
        <Dropdown
          align="right"
          trigger={
            <button aria-label="Open profile menu" className="rounded-full focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background" type="button">
              <Avatar name={displayName} size="sm" src={user?.avatar ?? undefined} />
            </button>
          }
        >
          <div className="border-b border-border px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{displayName}</p>
            <p className="truncate text-xs text-muted-foreground">{user?.email ?? organization?.name ?? "Signed in"}</p>
          </div>
          <DropdownLink href="/app/settings">
            <User aria-hidden="true" className="h-4 w-4" />
            Profile
          </DropdownLink>
          <DropdownLink href="/app/settings">
            <Settings aria-hidden="true" className="h-4 w-4" />
            Settings
          </DropdownLink>
          <DropdownButton disabled={logout.isPending} onClick={() => void handleLogout()}>
            <LogOut aria-hidden="true" className="h-4 w-4" />
            Logout
          </DropdownButton>
        </Dropdown>
      </div>
    </header>
  );
}

