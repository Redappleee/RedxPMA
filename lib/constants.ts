import { BarChart3, Bell, Boxes, LayoutDashboard, Settings, Users } from "lucide-react";
import { Route } from "next";

export const APP_NAME = "NexusPM";

export const SIDEBAR_LINKS: Array<{ href: Route; label: string; icon: typeof LayoutDashboard }> = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/products", label: "Products", icon: Boxes },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/team", label: "Team", icon: Users },
  { href: "/notifications", label: "Notifications", icon: Bell },
  { href: "/settings", label: "Settings", icon: Settings }
];

export const PRODUCT_CATEGORIES = [
  "SaaS",
  "AI Tooling",
  "Security",
  "Productivity",
  "Developer Tools",
  "Fintech"
] as const;
