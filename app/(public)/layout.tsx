import Link from "next/link";
import { ReactNode } from "react";

import { Logo } from "@/components/layout/logo";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { Button } from "@/ui/button";

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-screen overflow-x-hidden">
      <div className="pointer-events-none fixed inset-0 -z-10 bg-hero dark:bg-hero-dark" />
      <div className="pointer-events-none fixed inset-0 -z-10 noise-overlay opacity-35" />

      <header className="container py-6">
        <div className="glass flex items-center justify-between rounded-2xl px-4 py-3">
          <Logo />
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button asChild variant="ghost" size="sm">
              <Link href="/features">Features</Link>
            </Button>
            <Button asChild variant="ghost" size="sm">
              <Link href="/pricing">Pricing</Link>
            </Button>
            <Button asChild variant="outline" size="sm">
              <Link href="/login">Login</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/signup">Start Free</Link>
            </Button>
          </div>
        </div>
      </header>

      {children}
    </div>
  );
}
