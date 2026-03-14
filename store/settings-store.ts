import { create } from "zustand";
import { persist } from "zustand/middleware";

import { AppSettings, defaultSettings } from "@/types/settings";

interface SettingsState {
  settings: AppSettings;
  lastSavedAt: string | null;
  replaceSettings: (next: AppSettings, savedAt?: string | null) => void;
  resetSettings: () => void;
}

export const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      settings: defaultSettings,
      lastSavedAt: null,
      replaceSettings: (next, savedAt) =>
        set({ settings: next, lastSavedAt: savedAt ?? new Date().toISOString() }),
      resetSettings: () => set({ settings: defaultSettings, lastSavedAt: new Date().toISOString() })
    }),
    {
      name: "nexuspm-settings"
    }
  )
);
