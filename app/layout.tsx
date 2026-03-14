import type { Metadata } from "next";
import { ReactNode } from "react";

import "@/app/globals.css";
import { Providers } from "@/app/providers";

export const metadata: Metadata = {
  title: "NexusPM | Premium Product Management",
  description: "Modern SaaS platform for product teams with analytics, collaboration, and realtime workflows"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
