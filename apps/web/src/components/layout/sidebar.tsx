import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import { useMemo, useState, type ReactElement } from "react";
import { Link, useLocation } from "react-router-dom";
import { appNavigation, type NavigationItem } from "./navigation";
import { Button, Tooltip } from "@/components/ui";
import { transition } from "@/lib";
import { cn } from "@/utils";

export interface SidebarProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  mobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

interface SidebarContentProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigate?: (() => void) | undefined;
}

const isActiveItem = (pathname: string, item: NavigationItem): boolean => pathname === item.href || pathname.startsWith(`${item.href}/`);

function NavigationLink({ item, collapsed, pathname, level = 0, onNavigate }: { item: NavigationItem; collapsed: boolean; pathname: string; level?: number; onNavigate?: (() => void) | undefined }): ReactElement {
  const [open, setOpen] = useState(true);
  const hasChildren = Boolean(item.children?.length);
  const active = isActiveItem(pathname, item);
  const Icon = item.icon;
  const link = (
    <Link
      aria-current={active ? "page" : undefined}
      className={cn(
        "group relative flex h-10 items-center gap-3 rounded-lg px-3 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-primary/10 text-primary",
        collapsed && "justify-center px-0",
        level > 0 && !collapsed && "ml-6"
      )}
      onClick={onNavigate}
      to={item.href}
    >
      {active ? <motion.span layoutId="active-navigation-pill" className="absolute inset-y-1 left-1 w-1 rounded-full bg-primary" transition={transition} /> : null}
      <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </Link>
  );

  if (!hasChildren || collapsed) {
    return collapsed ? <Tooltip content={item.label}>{link}</Tooltip> : link;
  }

  return (
    <div className="grid gap-1">
      <div className="flex items-center gap-1">
        <div className="min-w-0 flex-1">{link}</div>
        <Button aria-expanded={open} aria-label={`Toggle ${item.label} navigation`} size="icon" variant="ghost" onClick={() => setOpen((current) => !current)}>
          <ChevronDown aria-hidden="true" className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
        </Button>
      </div>
      <AnimatePresence initial={false}>
        {open ? (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={transition} className="grid gap-1 overflow-hidden">
            {item.children?.map((child) => <NavigationLink key={child.href} item={child} collapsed={collapsed} pathname={pathname} level={level + 1} onNavigate={onNavigate} />)}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}

function SidebarContent({ collapsed, onCollapsedChange, onNavigate }: SidebarContentProps): ReactElement {
  const location = useLocation();
  const navigation = useMemo(() => appNavigation, []);

  return (
    <div className="flex h-full flex-col bg-surface">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border px-4">
        <Link className={cn("flex items-center gap-2 font-semibold text-foreground", collapsed && "justify-center")} to="/app/dashboard" onClick={onNavigate} aria-label="BizPilot AI application home">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary text-sm text-primary-foreground shadow-glow">B</span>
          {!collapsed ? <span>BizPilot AI</span> : null}
        </Link>
        {!collapsed ? (
          <Button aria-label="Collapse sidebar" size="icon" variant="ghost" onClick={() => onCollapsedChange(true)}>
            <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <nav aria-label="Primary navigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="grid gap-1">
          {navigation.map((item) => <NavigationLink key={item.href} item={item} collapsed={collapsed} pathname={location.pathname} onNavigate={onNavigate} />)}
        </div>
      </nav>
      <div className="border-t border-border p-3">
        {collapsed ? (
          <Tooltip content="Expand sidebar">
            <Button aria-label="Expand sidebar" className="w-full" size="icon" variant="ghost" onClick={() => onCollapsedChange(false)}>
              <PanelLeftOpen aria-hidden="true" className="h-4 w-4" />
            </Button>
          </Tooltip>
        ) : (
          <Button className="w-full justify-start" leftIcon={<PanelLeftClose aria-hidden="true" className="h-4 w-4" />} variant="ghost" onClick={() => onCollapsedChange(true)}>
            Collapse
          </Button>
        )}
      </div>
    </div>
  );
}

export function Sidebar({ collapsed, onCollapsedChange, mobileOpen, onMobileOpenChange }: SidebarProps): ReactElement {
  return (
    <>
      <motion.aside animate={{ width: collapsed ? 72 : 272 }} transition={transition} className="hidden h-dvh shrink-0 overflow-hidden border-r border-border bg-surface lg:block">
        <SidebarContent collapsed={collapsed} onCollapsedChange={onCollapsedChange} />
      </motion.aside>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            <button aria-label="Close navigation menu" className="absolute inset-0 bg-background/70 backdrop-blur-sm" type="button" onClick={() => onMobileOpenChange(false)} />
            <motion.aside initial={{ x: -288 }} animate={{ x: 0 }} exit={{ x: -288 }} transition={transition} className="relative h-full w-72 border-r border-border shadow-xl">
              <Button aria-label="Close navigation menu" className="absolute right-3 top-3 z-10" size="icon" variant="ghost" onClick={() => onMobileOpenChange(false)}>
                <X aria-hidden="true" className="h-4 w-4" />
              </Button>
              <SidebarContent collapsed={false} onCollapsedChange={onCollapsedChange} onNavigate={() => onMobileOpenChange(false)} />
            </motion.aside>
          </motion.div>
        ) : null}
      </AnimatePresence>
    </>
  );
}

