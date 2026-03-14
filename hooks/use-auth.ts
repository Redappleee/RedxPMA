"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";

export const useAuth = () => {
  const { user, setAuth, clearAuth, hydrated } = useAuthStore();

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    enabled: hydrated,
    retry: false
  });

  useEffect(() => {
    if (query.data) {
      setAuth(query.data);
    }

    if (query.error) {
      clearAuth();
    }
  }, [query.data, query.error, setAuth, clearAuth]);

  return {
    user,
    loading: query.isLoading || !hydrated,
    isAuthenticated: Boolean(user)
  };
};
