"use client";

import { motion } from "framer-motion";
import { PanelLeft } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { Logo } from "@/components/layout/logo";
import { SIDEBAR_LINKS } from "@/lib/constants";
import { cn } from "@/lib/utils";
import { useUIStore } from "@/store/ui-store";
import { Button } from "@/ui/button";

export const Sidebar = () => {
  const pathname = usePathname();
  const { sidebarCollapsed, toggleSidebar } = useUIStore();

  return (
    <motion.aside
      initial={false}
      animate={{ width: sidebarCollapsed ? 88 : 272 }}
      transition={{ type: "spring", stiffness: 240, damping: 26 }}
      className="glass fixed left-4 top-4 z-40 hidden h-[calc(100vh-2rem)] flex-col overflow-hidden rounded-3xl lg:flex"
    >
      <div className="flex items-center justify-between p-4">
        <div className={cn(sidebarCollapsed && "hidden")}>
          <Logo />
        </div>
        {sidebarCollapsed && <div className="mx-auto h-8 w-8 rounded-lg bg-primary" />}
        <Button variant="ghost" size="icon" onClick={toggleSidebar}>
          <PanelLeft className="h-4 w-4" />
        </Button>
      </div>

      <nav className="mt-4 flex-1 space-y-1 px-3">
        {SIDEBAR_LINKS.map((item) => {
          const active = pathname === item.href;

          return (
            <Link
              href={item.href}
              key={item.href}
              className={cn(
                "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm text-muted-foreground transition-all",
                active && "bg-primary text-primary-foreground shadow-glow",
                !active && "hover:bg-muted"
              )}
            >
              <item.icon className="h-4 w-4" />
              {!sidebarCollapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>
    </motion.aside>
  );
};
