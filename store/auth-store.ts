import { create } from "zustand";
import { persist } from "zustand/middleware";

import { IUser } from "@/types";

interface AuthState {
  user: IUser | null;
  token: string | null;
  hydrated: boolean;
  setAuth: (user: IUser, token?: string | null) => void;
  clearAuth: () => void;
  setHydrated: () => void;
}

const AUTH_COOKIE = "accessToken";
const AUTH_COOKIE_MAX_AGE_SECONDS = 7 * 24 * 60 * 60;

const setFrontendAuthCookie = (token: string) => {
  if (typeof document === "undefined") return;

  const secure = window.location.protocol === "https:" ? "; secure" : "";
  document.cookie = `${AUTH_COOKIE}=${encodeURIComponent(token)}; path=/; max-age=${AUTH_COOKIE_MAX_AGE_SECONDS}; samesite=lax${secure}`;
};

const clearFrontendAuthCookie = () => {
  if (typeof document === "undefined") return;

  document.cookie = `${AUTH_COOKIE}=; path=/; max-age=0; samesite=lax`;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      hydrated: false,
      setAuth: (user, token) => {
        if (token) {
          setFrontendAuthCookie(token);
        }

        set({ user, token: token ?? null });
      },
      clearAuth: () => {
        clearFrontendAuthCookie();
        set({ user: null, token: null });
      },
      setHydrated: () => set({ hydrated: true })
    }),
    {
      name: "nexuspm-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      }
    }
  )
);
