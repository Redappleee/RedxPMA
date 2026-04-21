"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";

export const useAuth = () => {
  const { user, token, setAuth, clearAuth, hydrated } = useAuthStore();

  const query = useQuery({
    queryKey: ["auth", "me"],
    queryFn: authService.me,
    enabled: hydrated && Boolean(token),
    retry: false
  });

  useEffect(() => {
    if (query.data) {
      setAuth(query.data, token);
    }

    if (query.error) {
      clearAuth();
    }
  }, [query.data, query.error, setAuth, clearAuth, token]);

  return {
    user,
    loading: !hydrated || (Boolean(token) && query.isLoading),
    isAuthenticated: Boolean(user)
  };
};
