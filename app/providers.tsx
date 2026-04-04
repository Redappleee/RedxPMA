"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

import { PublicBrandingSync } from "@/components/settings/public-branding-sync";
import { SettingsEffects } from "@/components/settings/settings-effects";
import { queryClient } from "@/lib/query-client";

export const Providers = ({ children }: { children: ReactNode }) => {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>
        <PublicBrandingSync />
        <SettingsEffects />
        {children}
      </QueryClientProvider>
    </ThemeProvider>
  );
};
