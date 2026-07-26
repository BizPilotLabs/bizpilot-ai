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
        "group relative flex h-10 items-center gap-3 rounded-xl px-3 text-sm font-medium text-muted-foreground transition-all duration-200 hover:bg-surface hover:text-foreground hover:shadow-xs focus-visible:ring-2 focus-visible:ring-ring",
        active && "bg-surface text-foreground shadow-[0_1px_0_hsl(var(--foreground)/0.04),0_10px_30px_hsl(var(--shadow-color)/0.08)]",
        collapsed && "justify-center px-0",
        level > 0 && !collapsed && "ml-6"
      )}
      onClick={onNavigate}
      to={item.href}
    >
      {active ? <motion.span layoutId="active-navigation-pill" className="absolute inset-y-2 left-1 w-1 rounded-full bg-primary" transition={transition} /> : null}
      <Icon aria-hidden="true" className={cn("h-4 w-4 shrink-0 transition-colors", active ? "text-primary" : "text-muted-foreground group-hover:text-foreground")} />
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
    <div className="flex h-full flex-col bg-surface-raised/80 backdrop-blur-xl">
      <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/60 px-4">
        <Link className={cn("flex items-center gap-2.5 font-semibold text-foreground", collapsed && "justify-center")} to="/app/dashboard" onClick={onNavigate} aria-label="BizPilot AI application home">
          <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-foreground text-sm text-background shadow-[0_12px_30px_hsl(var(--shadow-color)/0.20)]">B</span>
          {!collapsed ? <span className="tracking-normal">BizPilot AI</span> : null}
        </Link>
        {!collapsed ? (
          <Button aria-label="Collapse sidebar" size="icon" variant="ghost" onClick={() => onCollapsedChange(true)}>
            <PanelLeftClose aria-hidden="true" className="h-4 w-4" />
          </Button>
        ) : null}
      </div>
      <nav aria-label="Primary navigation" className="min-h-0 flex-1 overflow-y-auto px-3 py-4">
        <div className="grid gap-1.5">
          {navigation.map((item) => <NavigationLink key={item.href} item={item} collapsed={collapsed} pathname={location.pathname} onNavigate={onNavigate} />)}
        </div>
      </nav>
      <div className="border-t border-border/60 p-3">
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
      <motion.aside animate={{ width: collapsed ? 72 : 280 }} transition={transition} className="hidden h-dvh shrink-0 overflow-hidden border-r border-border/70 bg-surface-raised/80 lg:block">
        <SidebarContent collapsed={collapsed} onCollapsedChange={onCollapsedChange} />
      </motion.aside>
      <AnimatePresence>
        {mobileOpen ? (
          <motion.div className="fixed inset-0 z-50 lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={transition}>
            <button aria-label="Close navigation menu" className="absolute inset-0 bg-background/75 backdrop-blur-xl" type="button" onClick={() => onMobileOpenChange(false)} />
            <motion.aside initial={{ x: -304 }} animate={{ x: 0 }} exit={{ x: -304 }} transition={transition} className="relative h-full w-[19rem] border-r border-border/70 shadow-xl">
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

