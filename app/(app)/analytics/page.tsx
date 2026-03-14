"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis
} from "recharts";
import { Download, FilterX, Flame, Save, Sparkles, Target } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { TopNav } from "@/components/layout/top-nav";
import { analyticsService } from "@/services/analytics.service";
import { teamService } from "@/services/team.service";
import { AnalyticsGoals, AnalyticsPresetInput, AnalyticsSchedule } from "@/types/analytics";
import { DASHBOARD_RANGES, DashboardRange } from "@/types/dashboard";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Input } from "@/ui/input";
import { Label } from "@/ui/label";
import { Skeleton } from "@/ui/skeleton";

const RANGE_LABEL: Record<DashboardRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days"
};

const STATUS_COLORS: Record<"active" | "draft" | "archived", string> = {
  active: "hsl(var(--success))",
  draft: "hsl(var(--warning))",
  archived: "hsl(var(--muted-foreground))"
};

export default function AnalyticsPage() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const [range, setRange] = useState<DashboardRange>("30d");
  const [category, setCategory] = useState("");
  const [status, setStatus] = useState<"" | "active" | "draft" | "archived">("");
  const [managerId, setManagerId] = useState("");
  const [message, setMessage] = useState<string | null>(null);

  const [goalsDraft, setGoalsDraft] = useState<AnalyticsGoals>({
    revenueTarget: 50000,
    activeProductsTarget: 100,
    stockTurnoverTarget: 15
  });
  const [scheduleDraft, setScheduleDraft] = useState<AnalyticsSchedule>({
    enabled: false,
    frequency: "weekly",
    channel: "email",
    destination: "",
    weekday: 1,
    hour: 9
  });
  const [presetName, setPresetName] = useState("");
  const [presetSort, setPresetSort] = useState<AnalyticsPresetInput["sortBy"]>("revenue");
  const [localSort, setLocalSort] = useState<AnalyticsPresetInput["sortBy"]>("revenue");

  const queryParams = useMemo(
    () => ({
      range,
      ...(category ? { category } : {}),
      ...(status ? { status } : {}),
      ...(managerId ? { managerId } : {})
    }),
    [range, category, status, managerId]
  );

  const { data, isLoading, isError, error, isFetching } = useQuery({
    queryKey: ["analytics", queryParams],
    queryFn: () => analyticsService.overview(queryParams)
  });

  const { data: teamMembers } = useQuery({
    queryKey: ["team", "analytics-filter"],
    queryFn: teamService.list
  });

  useEffect(() => {
    if (!data) return;
    setGoalsDraft(data.goals.targets);
    setScheduleDraft(data.schedule);
  }, [data]);

  const saveGoalsMutation = useMutation({
    mutationFn: analyticsService.updateGoals,
    onSuccess: () => {
      setMessage("Goals updated.");
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (mutationError) => {
      setMessage(mutationError instanceof Error ? mutationError.message : "Failed to update goals");
    }
  });

  const saveScheduleMutation = useMutation({
    mutationFn: analyticsService.updateSchedule,
    onSuccess: () => {
      setMessage("Report schedule saved.");
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (mutationError) => {
      setMessage(mutationError instanceof Error ? mutationError.message : "Failed to save schedule");
    }
  });

  const createPresetMutation = useMutation({
    mutationFn: analyticsService.createPreset,
    onSuccess: () => {
      setPresetName("");
      setMessage("Preset saved.");
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (mutationError) => {
      setMessage(mutationError instanceof Error ? mutationError.message : "Failed to save preset");
    }
  });

  const deletePresetMutation = useMutation({
    mutationFn: analyticsService.deletePreset,
    onSuccess: () => {
      setMessage("Preset deleted.");
      queryClient.invalidateQueries({ queryKey: ["analytics"] });
    },
    onError: (mutationError) => {
      setMessage(mutationError instanceof Error ? mutationError.message : "Failed to delete preset");
    }
  });

  const downloadExport = async (format: "csv" | "json") => {
    try {
      const blob = await analyticsService.exportReport(queryParams, format);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `analytics-${range}-${new Date().toISOString().slice(0, 10)}.${format}`;
      anchor.click();
      URL.revokeObjectURL(url);
      setMessage(`${format.toUpperCase()} export ready.`);
    } catch (downloadError) {
      setMessage(downloadError instanceof Error ? downloadError.message : "Export failed");
    }
  };

  const sortedTopProducts = useMemo(() => {
    const products = [...(data?.topProducts ?? [])];
    if (localSort === "inventory") {
      return products.sort((a, b) => b.stock - a.stock);
    }

    if (localSort === "growth") {
      return products.sort((a, b) => a.status.localeCompare(b.status));
    }

    return products.sort((a, b) => b.price - a.price);
  }, [data?.topProducts, localSort]);

  const clearFilters = () => {
    setCategory("");
    setStatus("");
    setManagerId("");
    setMessage("Filters cleared.");
  };

  const applyPreset = (preset: { range: DashboardRange; filters: { category?: string; status?: "active" | "draft" | "archived"; managerId?: string }; sortBy: AnalyticsPresetInput["sortBy"] }) => {
    setRange(preset.range);
    setCategory(preset.filters.category ?? "");
    setStatus(preset.filters.status ?? "");
    setManagerId(preset.filters.managerId ?? "");
    setLocalSort(preset.sortBy);
    setMessage(`Applied preset with ${RANGE_LABEL[preset.range]}.`);
  };

  const drillToProducts = (filters: Record<string, string>) => {
    const query = new URLSearchParams(filters).toString();
    router.push(`/products${query ? `?${query}` : ""}` as never);
  };

  const growthBadge = data?.metrics.growthPercentage ?? 0;

  return (
    <section className="space-y-4">
      <TopNav />

      <Card className="p-1">
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <div>
            <CardTitle className="text-2xl">Analytics Intelligence</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Cohorts, funnels, forecasts, benchmarks, goals, exports, and scheduled reporting.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => downloadExport("csv")}>
              <Download className="h-4 w-4" />
              Export CSV
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadExport("json")}>
              <Download className="h-4 w-4" />
              Export JSON
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {DASHBOARD_RANGES.map((option) => (
              <button
                key={option}
                onClick={() => setRange(option)}
                className={`rounded-xl px-3 py-2 text-xs font-medium ${
                  range === option ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}
              >
                {RANGE_LABEL[option]}
              </button>
            ))}
          </div>
          <div className="grid gap-2 md:grid-cols-4">
            <select
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            >
              <option value="">All categories</option>
              {(data?.segments.categories ?? []).map((segment) => (
                <option key={segment.category} value={segment.category}>
                  {segment.category}
                </option>
              ))}
            </select>
            <select
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
              value={status}
              onChange={(event) => setStatus(event.target.value as "" | "active" | "draft" | "archived")}
            >
              <option value="">All status</option>
              <option value="active">Active</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </select>
            <select
              className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
              value={managerId}
              onChange={(event) => setManagerId(event.target.value)}
            >
              <option value="">All managers</option>
              {(teamMembers ?? [])
                .filter((member) => member.role === "manager" || member.role === "admin")
                .map((member) => (
                  <option key={member._id} value={member._id}>
                    {member.name}
                  </option>
                ))}
            </select>
            <Button variant="outline" onClick={clearFilters}>
              <FilterX className="h-4 w-4" />
              Clear filters
            </Button>
          </div>
          {message && <p className="text-xs text-muted-foreground">{message}</p>}
        </CardContent>
      </Card>

      {isError && (
        <Card className="border border-danger/40 p-1">
          <CardContent className="p-4 text-sm text-danger">{error instanceof Error ? error.message : "Failed to load analytics."}</CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <Skeleton key={index} className="h-[180px]" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            <Card className="p-1">
              <CardHeader>
                <CardTitle className="text-base">MRR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">${data?.metrics.mrr.toLocaleString("en-US")}</p>
                <p className="text-xs text-muted-foreground">
                  {data?.comparisons.previousPeriod.revenuePct && data.comparisons.previousPeriod.revenuePct >= 0 ? "+" : ""}
                  {data?.comparisons.previousPeriod.revenuePct}% vs previous period
                </p>
              </CardContent>
            </Card>
            <Card className="p-1">
              <CardHeader>
                <CardTitle className="text-base">ARR</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">${data?.metrics.arr.toLocaleString("en-US")}</p>
                <p className="text-xs text-muted-foreground">Annualized from current MRR</p>
              </CardContent>
            </Card>
            <Card className="p-1">
              <CardHeader>
                <CardTitle className="text-base">Inventory Health</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{data?.inventoryHealth.score}</p>
                <p className="text-xs text-muted-foreground">
                  Low: {data?.inventoryHealth.lowStock} • Overstock: {data?.inventoryHealth.overstock}
                </p>
              </CardContent>
            </Card>
            <Card className="p-1">
              <CardHeader>
                <CardTitle className="text-base">Growth</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-3xl font-semibold">{growthBadge}%</p>
                <p className="text-xs text-muted-foreground">
                  {data?.comparisons.lastQuarterEquivalent.growthDelta && data.comparisons.lastQuarterEquivalent.growthDelta >= 0 ? "+" : ""}
                  {data?.comparisons.lastQuarterEquivalent.growthDelta} pts vs last quarter equivalent
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
            <Card className="p-1">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Revenue trend and drill-down</CardTitle>
                {isFetching && <p className="text-xs text-muted-foreground">Refreshing...</p>}
              </CardHeader>
              <CardContent className="h-[320px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart
                    data={data?.timeseries ?? []}
                    onClick={(event) => {
                      const payload = event?.activePayload?.[0]?.payload as { date?: string } | undefined;
                      if (!payload?.date) return;
                      drillToProducts({
                        sort: "newest",
                        ...(category ? { category } : {}),
                        ...(status ? { status } : {})
                      });
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                    <XAxis dataKey="label" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="hsl(var(--primary)/0.2)" />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card className="p-1">
              <CardHeader>
                <CardTitle>Forecast</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {[
                  { label: "Next 7d", value: data?.forecasts.next7Days },
                  { label: "Next 30d", value: data?.forecasts.next30Days },
                  { label: "Next 90d", value: data?.forecasts.next90Days }
                ].map((item) => (
                  <div key={item.label} className="rounded-xl border border-border/70 bg-card/70 p-3">
                    <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{item.label}</p>
                    <p className="mt-1 text-xl font-semibold">${item.value?.revenue.toLocaleString("en-US")}</p>
                    <p className="text-xs text-muted-foreground">
                      Range: ${item.value?.lower.toLocaleString("en-US")} - ${item.value?.upper.toLocaleString("en-US")}
                    </p>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card className="p-1">
              <CardHeader>
                <CardTitle>Funnel analytics (draft to active to archived)</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[
                      { stage: "draft", count: data?.funnel.draft ?? 0 },
                      { stage: "active", count: data?.funnel.active ?? 0 },
                      { stage: "archived", count: data?.funnel.archived ?? 0 }
                    ]}
                    onClick={(event) => {
                      const payload = event?.activePayload?.[0]?.payload as { stage?: "active" | "draft" | "archived" } | undefined;
                      if (!payload?.stage) return;
                      drillToProducts({
                        status: payload.stage,
                        sort: "newest",
                        ...(category ? { category } : {})
                      });
                    }}
                  >
                    <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                    <XAxis dataKey="stage" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="count" radius={[8, 8, 0, 0]}>
                      <Cell fill={STATUS_COLORS.draft} />
                      <Cell fill={STATUS_COLORS.active} />
                      <Cell fill={STATUS_COLORS.archived} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
                <div className="mt-3 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <p>Draft to Active: {data?.funnel.draftToActiveRate}%</p>
                  <p>Active to Archived: {data?.funnel.activeToArchivedRate}%</p>
                  <p>Draft to Archived: {data?.funnel.draftToArchivedRate}%</p>
                </div>
              </CardContent>
            </Card>

            <Card className="p-1">
              <CardHeader>
                <CardTitle>Segment breakdown</CardTitle>
              </CardHeader>
              <CardContent className="grid gap-3 md:grid-cols-2">
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                      data={data?.segments.categories ?? []}
                      layout="vertical"
                      onClick={(event) => {
                        const payload = event?.activePayload?.[0]?.payload as { category?: string } | undefined;
                        if (!payload?.category) return;
                        setCategory(payload.category);
                      }}
                    >
                      <CartesianGrid strokeDasharray="3 3" opacity={0.18} />
                      <XAxis type="number" hide />
                      <YAxis type="category" dataKey="category" width={90} tick={{ fontSize: 11 }} />
                      <Tooltip />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 8, 8]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={data?.segments.categories ?? []}
                        dataKey="count"
                        nameKey="category"
                        cx="50%"
                        cy="50%"
                        outerRadius={80}
                        innerRadius={45}
                        onClick={(payload) => {
                          const selected = payload as { category?: string };
                          if (selected?.category) {
                            drillToProducts({ category: selected.category, sort: "newest" });
                          }
                        }}
                      >
                        {(data?.segments.categories ?? []).map((segment, index) => (
                          <Cell
                            key={segment.category}
                            fill={index % 2 === 0 ? "hsl(var(--primary))" : "hsl(var(--primary)/0.5)"}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
            <Card className="p-1">
              <CardHeader>
                <CardTitle>Cohort retention (inferred)</CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto">
                <table className="w-full text-sm">
                  <thead className="text-left text-xs text-muted-foreground">
                    <tr>
                      <th className="pb-2">Cohort</th>
                      <th className="pb-2">Size</th>
                      <th className="pb-2">M1</th>
                      <th className="pb-2">M2</th>
                      <th className="pb-2">M3</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(data?.cohorts ?? []).map((row) => (
                      <tr key={row.month} className="border-t border-border/60">
                        <td className="py-2">{row.month}</td>
                        <td className="py-2">{row.size}</td>
                        <td className="py-2">{row.m1 === null ? "—" : `${row.m1}%`}</td>
                        <td className="py-2">{row.m2 === null ? "—" : `${row.m2}%`}</td>
                        <td className="py-2">{row.m3 === null ? "—" : `${row.m3}%`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </CardContent>
            </Card>

            <Card className="p-1">
              <CardHeader>
                <CardTitle>Anomaly detection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {(data?.anomalies ?? []).length === 0 && (
                  <p className="text-sm text-muted-foreground">No anomalies detected in the selected period.</p>
                )}
                {(data?.anomalies ?? []).map((anomaly, index) => (
                  <div key={`${anomaly.date}-${anomaly.metric}-${index}`} className="rounded-xl border border-border bg-card/70 p-3">
                    <p className="text-sm font-medium">
                      {anomaly.label} • {anomaly.metric}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Value: {anomaly.value.toLocaleString("en-US")} • Z-score: {anomaly.zScore}
                    </p>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="mt-2 h-7 px-2 text-xs"
                      onClick={() =>
                        drillToProducts({
                          sort: "newest",
                          ...(category ? { category } : {}),
                          ...(status ? { status } : {})
                        })
                      }
                    >
                      Investigate
                    </Button>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
            <Card className="p-1">
              <CardHeader className="flex-row items-center justify-between">
                <CardTitle>Top products</CardTitle>
                <select
                  className="h-8 rounded-lg border border-border bg-card px-2 text-xs"
                  value={localSort}
                  onChange={(event) => setLocalSort(event.target.value as AnalyticsPresetInput["sortBy"])}
                >
                  <option value="revenue">Sort: Revenue</option>
                  <option value="inventory">Sort: Inventory</option>
                  <option value="growth">Sort: Growth</option>
                </select>
              </CardHeader>
              <CardContent className="space-y-2">
                {sortedTopProducts.map((product) => (
                  <button
                    key={product._id}
                    type="button"
                    onClick={() =>
                      drillToProducts({
                        category: product.category,
                        status: product.status,
                        sort: "newest"
                      })
                    }
                    className="grid w-full grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl border border-border bg-card px-3 py-2 text-left"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
                    </div>
                    <p className="text-xs uppercase text-muted-foreground">{product.status}</p>
                    <div className="text-right">
                      <p className="text-sm font-semibold">${product.price.toLocaleString("en-US")}</p>
                      <p className="text-xs text-muted-foreground">{product.stock} stock</p>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card className="p-1">
              <CardHeader>
                <CardTitle>Comparative benchmarking</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="font-medium">Vs previous period</p>
                  <p className="text-xs text-muted-foreground">
                    Revenue {data?.comparisons.previousPeriod.revenuePct}% • Products {data?.comparisons.previousPeriod.productsPct}% •
                    Inventory {data?.comparisons.previousPeriod.inventoryPct}%
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="font-medium">Vs same period last quarter</p>
                  <p className="text-xs text-muted-foreground">
                    Revenue {data?.comparisons.lastQuarterEquivalent.revenuePct}% • Products{" "}
                    {data?.comparisons.lastQuarterEquivalent.productsPct}% • Growth delta{" "}
                    {data?.comparisons.lastQuarterEquivalent.growthDelta} pts
                  </p>
                </div>
                <div className="rounded-xl border border-border/70 bg-card/70 p-3">
                  <p className="flex items-center gap-2 font-medium">
                    <Flame className="h-4 w-4 text-warning" />
                    Inventory health score
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Score {data?.inventoryHealth.score} • Aging risk {data?.inventoryHealth.agingRisk} • Turnover{" "}
                    {data?.inventoryHealth.stockTurnover}
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card className="p-1 xl:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-4 w-4" />
                  Goal tracking
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Revenue target</Label>
                  <Input
                    type="number"
                    value={goalsDraft.revenueTarget}
                    onChange={(event) =>
                      setGoalsDraft((prev) => ({ ...prev, revenueTarget: Number(event.target.value || 0) }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Progress: {data?.goals.progress.revenue.progressPct}% ({data?.goals.progress.revenue.current} /{" "}
                    {data?.goals.progress.revenue.target})
                  </p>
                </div>
                <div>
                  <Label>Active products target</Label>
                  <Input
                    type="number"
                    value={goalsDraft.activeProductsTarget}
                    onChange={(event) =>
                      setGoalsDraft((prev) => ({ ...prev, activeProductsTarget: Number(event.target.value || 0) }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Progress: {data?.goals.progress.activeProducts.progressPct}% ({data?.goals.progress.activeProducts.current} /{" "}
                    {data?.goals.progress.activeProducts.target})
                  </p>
                </div>
                <div>
                  <Label>Stock turnover target</Label>
                  <Input
                    type="number"
                    step={0.1}
                    value={goalsDraft.stockTurnoverTarget}
                    onChange={(event) =>
                      setGoalsDraft((prev) => ({ ...prev, stockTurnoverTarget: Number(event.target.value || 0) }))
                    }
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Progress: {data?.goals.progress.stockTurnover.progressPct}% ({data?.goals.progress.stockTurnover.current} /{" "}
                    {data?.goals.progress.stockTurnover.target})
                  </p>
                </div>
                <Button onClick={() => saveGoalsMutation.mutate(goalsDraft)} disabled={saveGoalsMutation.isPending}>
                  <Save className="h-4 w-4" />
                  Save goals
                </Button>
              </CardContent>
            </Card>

            <Card className="p-1 xl:col-span-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Custom report builder
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label>Preset name</Label>
                  <Input value={presetName} onChange={(event) => setPresetName(event.target.value)} />
                </div>
                <div>
                  <Label>Sort mode</Label>
                  <select
                    className="h-10 w-full rounded-xl border border-border bg-card px-3 text-sm"
                    value={presetSort}
                    onChange={(event) => setPresetSort(event.target.value as AnalyticsPresetInput["sortBy"])}
                  >
                    <option value="revenue">Revenue</option>
                    <option value="inventory">Inventory</option>
                    <option value="growth">Growth</option>
                  </select>
                </div>
                <Button
                  onClick={() =>
                    createPresetMutation.mutate({
                      name: presetName.trim() || "Untitled preset",
                      range,
                      filters: {
                        ...(category ? { category } : {}),
                        ...(status ? { status } : {}),
                        ...(managerId ? { managerId } : {})
                      },
                      sortBy: presetSort
                    })
                  }
                  disabled={createPresetMutation.isPending}
                >
                  <Save className="h-4 w-4" />
                  Save preset
                </Button>
                <div className="space-y-2">
                  {(data?.presets ?? []).map((preset) => (
                    <div key={preset.id} className="flex items-center justify-between rounded-xl border border-border/70 bg-card/70 p-2">
                      <button
                        type="button"
                        className="text-left text-xs"
                        onClick={() => applyPreset(preset)}
                      >
                        <p className="font-medium">{preset.name}</p>
                        <p className="text-muted-foreground">{RANGE_LABEL[preset.range]}</p>
                      </button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => deletePresetMutation.mutate(preset.id)}
                        disabled={deletePresetMutation.isPending}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="p-1 xl:col-span-1">
              <CardHeader>
                <CardTitle>Scheduled reports</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={scheduleDraft.enabled}
                    onChange={(event) => setScheduleDraft((prev) => ({ ...prev, enabled: event.target.checked }))}
                  />
                  Enable scheduled report delivery
                </label>
                <div className="grid gap-2 sm:grid-cols-2">
                  <select
                    className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                    value={scheduleDraft.frequency}
                    onChange={(event) =>
                      setScheduleDraft((prev) => ({ ...prev, frequency: event.target.value as "weekly" | "monthly" }))
                    }
                  >
                    <option value="weekly">Weekly</option>
                    <option value="monthly">Monthly</option>
                  </select>
                  <select
                    className="h-10 rounded-xl border border-border bg-card px-3 text-sm"
                    value={scheduleDraft.channel}
                    onChange={(event) =>
                      setScheduleDraft((prev) => ({ ...prev, channel: event.target.value as "email" | "slack" }))
                    }
                  >
                    <option value="email">Email</option>
                    <option value="slack">Slack</option>
                  </select>
                </div>
                <div className="grid gap-2 sm:grid-cols-2">
                  <Input
                    type="number"
                    min={0}
                    max={6}
                    value={scheduleDraft.weekday}
                    onChange={(event) => setScheduleDraft((prev) => ({ ...prev, weekday: Number(event.target.value || 0) }))}
                  />
                  <Input
                    type="number"
                    min={0}
                    max={23}
                    value={scheduleDraft.hour}
                    onChange={(event) => setScheduleDraft((prev) => ({ ...prev, hour: Number(event.target.value || 0) }))}
                  />
                </div>
                <Input
                  placeholder={scheduleDraft.channel === "email" ? "reports@company.com" : "#analytics-channel"}
                  value={scheduleDraft.destination}
                  onChange={(event) => setScheduleDraft((prev) => ({ ...prev, destination: event.target.value }))}
                />
                <Button onClick={() => saveScheduleMutation.mutate(scheduleDraft)} disabled={saveScheduleMutation.isPending}>
                  <Save className="h-4 w-4" />
                  Save schedule
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}
    </section>
  );
}
