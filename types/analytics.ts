import { DashboardRange } from "@/types/dashboard";
import { ProductStatus } from "@/types";

export interface AnalyticsFilters {
  category?: string;
  status?: ProductStatus;
  managerId?: string;
}

export interface AnalyticsGoals {
  revenueTarget: number;
  activeProductsTarget: number;
  stockTurnoverTarget: number;
}

export type AnalyticsReportFrequency = "weekly" | "monthly";
export type AnalyticsReportChannel = "email" | "slack";

export interface AnalyticsSchedule {
  enabled: boolean;
  frequency: AnalyticsReportFrequency;
  channel: AnalyticsReportChannel;
  destination: string;
  weekday: number;
  hour: number;
}

export interface AnalyticsPresetInput {
  name: string;
  range: DashboardRange;
  filters: AnalyticsFilters;
  sortBy: "revenue" | "inventory" | "growth";
}

export interface AnalyticsPreset extends AnalyticsPresetInput {
  id: string;
  createdAt: string;
}
