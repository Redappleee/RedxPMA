"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect } from "react";

import { settingsService } from "@/services/settings.service";
import { useSettingsStore } from "@/store/settings-store";

export const PublicBrandingSync = () => {
  const updateWorkspaceBranding = useSettingsStore((state) => state.updateWorkspaceBranding);

  const brandingQuery = useQuery({
    queryKey: ["settings", "public-branding"],
    queryFn: settingsService.getPublicBranding,
    staleTime: 60_000,
    retry: false
  });

  useEffect(() => {
    if (!brandingQuery.data) return;
    updateWorkspaceBranding(brandingQuery.data.workspace, brandingQuery.data.updatedAt);
  }, [brandingQuery.data, updateWorkspaceBranding]);

  return null;
};
