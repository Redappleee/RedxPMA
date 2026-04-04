import { apiClient } from "@/lib/api-client";
import { AppSettings } from "@/types/settings";

export interface SettingsResponse {
  settings: AppSettings;
  updatedAt?: string;
  message?: string;
}

export interface PublicBrandingResponse {
  workspace: Pick<AppSettings["workspace"], "companyName" | "logoUrl">;
  updatedAt?: string;
}

export const settingsService = {
  async getPublicBranding() {
    const { data } = await apiClient.get<PublicBrandingResponse>("/settings/public");
    return data;
  },
  async get() {
    const { data } = await apiClient.get<SettingsResponse>("/settings");
    return data;
  },
  async update(payload: AppSettings) {
    const { data } = await apiClient.put<SettingsResponse>("/settings", payload);
    return data;
  },
  async reset() {
    const { data } = await apiClient.post<SettingsResponse>("/settings/reset");
    return data;
  }
};
