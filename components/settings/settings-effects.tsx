"use client";

import { useEffect } from "react";

import { authService } from "@/services/auth.service";
import { useAuthStore } from "@/store/auth-store";
import { useSettingsStore } from "@/store/settings-store";

const ACTIVITY_EVENTS = ["mousemove", "keydown", "click", "scroll", "touchstart"] as const;

export const SettingsEffects = () => {
  const settings = useSettingsStore((state) => state.settings);
  const user = useAuthStore((state) => state.user);
  const clearAuth = useAuthStore((state) => state.clearAuth);

  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    root.dataset.accent = settings.appearance.accentColor;
    body.classList.toggle("compact-mode", settings.appearance.compactMode);
    body.classList.toggle("reduced-motion", settings.appearance.reduceMotion);

    return () => {
      delete root.dataset.accent;
      body.classList.remove("compact-mode");
      body.classList.remove("reduced-motion");
    };
  }, [settings.appearance.accentColor, settings.appearance.compactMode, settings.appearance.reduceMotion]);

  useEffect(() => {
    if (!user) return;

    let timeoutId: ReturnType<typeof setTimeout> | null = null;
    const timeoutMs = settings.security.sessionTimeoutMinutes * 60 * 1000;

    const scheduleLogout = () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      timeoutId = setTimeout(async () => {
        await authService.logout().catch(() => undefined);
        clearAuth();
        window.location.href = "/login";
      }, timeoutMs);
    };

    ACTIVITY_EVENTS.forEach((eventName) => window.addEventListener(eventName, scheduleLogout, { passive: true }));
    scheduleLogout();

    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      ACTIVITY_EVENTS.forEach((eventName) => window.removeEventListener(eventName, scheduleLogout));
    };
  }, [clearAuth, settings.security.sessionTimeoutMinutes, user]);

  return null;
};
