export const DASHBOARD_RANGES = ["7d", "30d", "90d"] as const;
export type DashboardRange = (typeof DASHBOARD_RANGES)[number];

export const DASHBOARD_RANGE_DAYS: Record<DashboardRange, number> = {
  "7d": 7,
  "30d": 30,
  "90d": 90
};

export const DASHBOARD_WIDGET_KEYS = ["kpis", "revenue", "status", "activity", "topProducts"] as const;
export type DashboardWidgetKey = (typeof DASHBOARD_WIDGET_KEYS)[number];

export const DEFAULT_DASHBOARD_LAYOUT: DashboardWidgetKey[] = [
  "kpis",
  "revenue",
  "status",
  "activity",
  "topProducts"
];
