"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ReactNode } from "react";

import { useAuth } from "@/hooks/use-auth";
import { Skeleton } from "@/ui/skeleton";

export const AuthGuard = ({ children }: { children: ReactNode }) => {
  const router = useRouter();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return (
      <div className="space-y-3 p-4">
        <Skeleton className="h-14" />
        <Skeleton className="h-40" />
        <Skeleton className="h-40" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};
