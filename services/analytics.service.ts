import { apiClient } from "@/lib/api-client";
import {
  AnalyticsGoals,
  AnalyticsPreset,
  AnalyticsPresetInput,
  AnalyticsSchedule
} from "@/types/analytics";
import { DashboardRange } from "@/types/dashboard";

export interface AnalyticsOverviewResponse {
  range: DashboardRange;
  filters: {
    category?: string;
    status?: "active" | "draft" | "archived";
    managerId?: string;
  };
  metrics: {
    mrr: number;
    arr: number;
    totalProducts: number;
    totalInventory: number;
    growthPercentage: number;
  };
  comparisons: {
    previousPeriod: {
      revenuePct: number;
      productsPct: number;
      inventoryPct: number;
      growthDelta: number;
    };
    lastQuarterEquivalent: {
      revenuePct: number;
      productsPct: number;
      inventoryPct: number;
      growthDelta: number;
    };
  };
  forecasts: {
    next7Days: { revenue: number; lower: number; upper: number };
    next30Days: { revenue: number; lower: number; upper: number };
    next90Days: { revenue: number; lower: number; upper: number };
  };
  inventoryHealth: {
    score: number;
    lowStock: number;
    overstock: number;
    agingRisk: number;
    stockTurnover: number;
  };
  funnel: {
    draft: number;
    active: number;
    archived: number;
    draftToActiveRate: number;
    activeToArchivedRate: number;
    draftToArchivedRate: number;
  };
  cohorts: Array<{ month: string; size: number; m1: number | null; m2: number | null; m3: number | null }>;
  anomalies: Array<{
    date: string;
    label: string;
    metric: "revenue" | "products";
    value: number;
    zScore: number;
    severity: "moderate" | "high";
  }>;
  timeseries: Array<{ date: string; label: string; products: number; revenue: number }>;
  segments: {
    categories: Array<{ category: string; count: number; revenue: number }>;
    managers: Array<{ managerId: string; name: string; count: number; revenue: number }>;
  };
  topProducts: Array<{
    _id: string;
    name: string;
    category: string;
    status: "active" | "draft" | "archived";
    price: number;
    stock: number;
    createdAt: string;
    assignedManagers: string[];
  }>;
  goals: {
    targets: AnalyticsGoals;
    progress: {
      revenue: { target: number; current: number; progressPct: number };
      activeProducts: { target: number; current: number; progressPct: number };
      stockTurnover: { target: number; current: number; progressPct: number };
    };
  };
  presets: AnalyticsPreset[];
  schedule: AnalyticsSchedule;
}

export const analyticsService = {
  async overview(params: {
    range: DashboardRange;
    category?: string;
    status?: "active" | "draft" | "archived";
    managerId?: string;
  }) {
    const { data } = await apiClient.get<AnalyticsOverviewResponse>("/analytics", { params });
    return data;
  },
  async updateGoals(payload: AnalyticsGoals) {
    const { data } = await apiClient.put<{ goals: AnalyticsGoals }>("/analytics/goals", payload);
    return data.goals;
  },
  async createPreset(payload: AnalyticsPresetInput) {
    const { data } = await apiClient.post<{ presets: AnalyticsPreset[] }>("/analytics/presets", payload);
    return data.presets;
  },
  async deletePreset(presetId: string) {
    const { data } = await apiClient.delete<{ presets: AnalyticsPreset[] }>(`/analytics/presets/${presetId}`);
    return data.presets;
  },
  async updateSchedule(payload: AnalyticsSchedule) {
    const { data } = await apiClient.put<{ schedule: AnalyticsSchedule }>("/analytics/schedule", payload);
    return data.schedule;
  },
  async exportReport(
    params: { range: DashboardRange; category?: string; status?: "active" | "draft" | "archived"; managerId?: string },
    format: "csv" | "json" = "csv"
  ) {
    const response = await apiClient.get<Blob>("/analytics/export", {
      params: { ...params, format },
      responseType: "blob"
    });
    return response.data;
  }
};
