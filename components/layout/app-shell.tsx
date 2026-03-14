"use client";

import { ReactNode } from "react";

import { Sidebar } from "@/components/layout/sidebar";

export const AppShell = ({ children }: { children: ReactNode }) => {
  return (
    <div className="min-h-screen bg-background">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-hero dark:bg-hero-dark" />
      <div className="pointer-events-none fixed inset-0 -z-10 noise-overlay opacity-40" />
      <Sidebar />
      <main className="min-h-screen px-4 pb-8 pt-4 lg:ml-[288px]">{children}</main>
    </div>
  );
};
