import Link from "next/link";

import { Button } from "@/ui/button";

export default function NotFound() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center text-center">
      <p className="text-sm uppercase tracking-[0.2em] text-muted-foreground">404</p>
      <h1 className="mt-3 text-4xl font-semibold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you requested does not exist.</p>
      <Button asChild className="mt-6">
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  );
}
