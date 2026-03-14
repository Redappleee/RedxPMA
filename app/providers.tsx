"use client";

import { GoogleOAuthProvider } from "@react-oauth/google";
import { QueryClientProvider } from "@tanstack/react-query";
import { ThemeProvider } from "next-themes";
import { ReactNode } from "react";

import { env } from "@/lib/env";
import { queryClient } from "@/lib/query-client";

export const Providers = ({ children }: { children: ReactNode }) => {
  const appProviders = (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </ThemeProvider>
  );

  if (!env.NEXT_PUBLIC_GOOGLE_CLIENT_ID) {
    return appProviders;
  }

  return <GoogleOAuthProvider clientId={env.NEXT_PUBLIC_GOOGLE_CLIENT_ID}>{appProviders}</GoogleOAuthProvider>;
};
