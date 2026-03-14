"use client";

import { LogOut, UserCircle2 } from "lucide-react";
import { useRouter } from "next/navigation";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { Button } from "@/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/ui/dropdown-menu";

export const UserMenu = () => {
  const router = useRouter();
  const { user, clearAuth } = useAuthStore();

  const onLogout = async () => {
    await authService.logout();
    clearAuth();
    router.push("/login");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="gap-2 rounded-xl px-3">
          <UserCircle2 className="h-4 w-4" />
          <span className="hidden text-xs font-medium sm:inline">{user?.name ?? "Account"}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem className="font-medium">{user?.email ?? "Guest"}</DropdownMenuItem>
        <DropdownMenuItem onClick={onLogout} className="text-danger">
          <LogOut className="mr-2 h-4 w-4" />
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
