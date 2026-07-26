import { motion } from "framer-motion";
import { useState, type ReactElement } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./sidebar";
import { TopNavigation } from "./top-navigation";
import { pageTransition } from "@/lib";

export function AppLayout(): ReactElement {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  return (
    <div className="flex h-dvh overflow-hidden bg-background text-foreground">
      <Sidebar collapsed={sidebarCollapsed} mobileOpen={mobileSidebarOpen} onCollapsedChange={setSidebarCollapsed} onMobileOpenChange={setMobileSidebarOpen} />
      <div className="relative flex min-w-0 flex-1 flex-col">
        <TopNavigation onMobileMenuOpen={() => setMobileSidebarOpen(true)} />
        <motion.main variants={pageTransition} initial="hidden" animate="visible" className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-5 sm:px-6 lg:px-8 lg:py-8">
            <Outlet />
          </div>
        </motion.main>
      </div>
    </div>
  );
}
