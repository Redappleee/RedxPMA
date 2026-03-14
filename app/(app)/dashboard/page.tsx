"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import {
  Activity,
  ArrowRight,
  Boxes,
  CircleAlert,
  DollarSign,
  GripVertical,
  PackageCheck,
  PackageX,
  RefreshCw,
  Users
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { ActivityFeed } from "@/components/dashboard/activity-feed";
import { StatCard } from "@/components/dashboard/stat-card";
import { TopNav } from "@/components/layout/top-nav";
import { useRealtime } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";
import { authService } from "@/services/auth.service";
import { productService } from "@/services/product.service";
import { useAuthStore } from "@/store/auth-store";
import {
  DASHBOARD_RANGES,
  DashboardRange,
  DashboardWidgetKey,
  DEFAULT_DASHBOARD_LAYOUT
} from "@/types/dashboard";
import { IActivity } from "@/types";
import { Badge } from "@/ui/badge";
import { Button } from "@/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/ui/card";
import { Skeleton } from "@/ui/skeleton";

const RevenueChart = dynamic(
  () => import("@/components/charts/revenue-chart").then((module) => module.RevenueChart),
  { loading: () => <Skeleton className="h-[360px]" /> }
);

interface DashboardResponse {
  range: DashboardRange;
  metrics: {
    totalProducts: number;
    totalInventory: number;
    monthlyRevenue: number;
    growthPercentage: number;
  };
  comparisons: {
    productsPct: number;
    inventoryPct: number;
    revenuePct: number;
    growthDelta: number;
  };
  activity: IActivity[];
  productMix: Array<{ _id: "active" | "draft" | "archived"; count: number }>;
  topProducts: Array<{
    _id: string;
    name: string;
    category: string;
    status: "active" | "draft" | "archived";
    price: number;
    stock: number;
  }>;
  timeseries: Array<{ date: string; label: string; products: number; revenue: number }>;
}

const WIDGET_LABELS: Record<DashboardWidgetKey, string> = {
  kpis: "Key Metrics",
  revenue: "Revenue Trend",
  status: "Status Distribution",
  activity: "Activity Feed",
  topProducts: "Top Products"
};

const WIDGET_SPAN: Record<DashboardWidgetKey, string> = {
  kpis: "md:col-span-2",
  revenue: "md:col-span-1",
  status: "md:col-span-1",
  activity: "md:col-span-1",
  topProducts: "md:col-span-1"
};

const RANGE_LABELS: Record<DashboardRange, string> = {
  "7d": "7 days",
  "30d": "30 days",
  "90d": "90 days"
};

const moveWidget = (layout: DashboardWidgetKey[], fromIndex: number, toIndex: number) => {
  const next = [...layout];
  const [moved] = next.splice(fromIndex, 1);
  next.splice(toIndex, 0, moved);
  return next;
};

const trendFromValue = (value: number): "up" | "down" | "neutral" => {
  if (value > 0) return "up";
  if (value < 0) return "down";
  return "neutral";
};

export default function DashboardPage() {
  const queryClient = useQueryClient();
  const user = useAuthStore((state) => state.user);
  const userId = user?._id;
  const [range, setRange] = useState<DashboardRange>("30d");
  const [widgetOrder, setWidgetOrder] = useState<DashboardWidgetKey[]>(DEFAULT_DASHBOARD_LAYOUT);
  const [draggingWidget, setDraggingWidget] = useState<DashboardWidgetKey | null>(null);
  const [layoutMessage, setLayoutMessage] = useState<string | null>(null);
  const layoutHydratedRef = useRef(false);

  const { data, isLoading, isFetching, isError, error } = useQuery<DashboardResponse>({
    queryKey: ["dashboard", range],
    queryFn: () => productService.dashboard(range)
  });

  const layoutQuery = useQuery({
    queryKey: ["dashboard-layout", userId],
    queryFn: authService.getDashboardLayout,
    enabled: Boolean(userId)
  });

  const saveLayoutMutation = useMutation({
    mutationFn: (layout: DashboardWidgetKey[]) => authService.updateDashboardLayout(layout),
    onSuccess: (layout) => {
      if (userId) {
        queryClient.setQueryData(["dashboard-layout", userId], layout);
      }
      setLayoutMessage("Layout saved.");
    },
    onError: (mutationError) => {
      setLayoutMessage(mutationError instanceof Error ? mutationError.message : "Failed to save layout");
    }
  });

  useEffect(() => {
    layoutHydratedRef.current = false;
    setWidgetOrder(DEFAULT_DASHBOARD_LAYOUT);
  }, [userId]);

  useEffect(() => {
    if (!layoutQuery.data || layoutHydratedRef.current) return;
    setWidgetOrder(layoutQuery.data);
    layoutHydratedRef.current = true;
  }, [layoutQuery.data]);

  const refresh = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
  }, [queryClient]);

  useRealtime("product:created", refresh, userId);
  useRealtime("product:updated", refresh, userId);
  useRealtime("product:deleted", refresh, userId);
  useRealtime("notification:new", refresh, userId);

  const metrics = data?.metrics ?? {
    totalProducts: 0,
    totalInventory: 0,
    monthlyRevenue: 0,
    growthPercentage: 0
  };
  const comparisons = data?.comparisons ?? {
    productsPct: 0,
    inventoryPct: 0,
    revenuePct: 0,
    growthDelta: 0
  };
  const topProducts = data?.topProducts ?? [];

  const statusCounts = useMemo(() => {
    const source = data?.productMix ?? [];
    return source.reduce(
      (acc, item) => {
        acc[item._id] = item.count;
        return acc;
      },
      { active: 0, draft: 0, archived: 0 } as Record<"active" | "draft" | "archived", number>
    );
  }, [data?.productMix]);

  const lowStockCount = topProducts.filter((product) => product.stock <= 20).length;
  const averagePrice = topProducts.length
    ? Math.round(topProducts.reduce((sum, product) => sum + product.price, 0) / topProducts.length)
    : 0;
  const activeShare = metrics.totalProducts > 0 ? Math.round((statusCounts.active / metrics.totalProducts) * 100) : 0;

  const chartData = (data?.timeseries ?? []).map((item) => ({
    name: item.label,
    value: item.revenue
  }));

  const statusRows = [
    { key: "active" as const, label: "Active", count: statusCounts.active, tone: "bg-success" },
    { key: "draft" as const, label: "Draft", count: statusCounts.draft, tone: "bg-warning" },
    { key: "archived" as const, label: "Archived", count: statusCounts.archived, tone: "bg-muted-foreground" }
  ];

  const reorderWidgets = useCallback(
    (sourceWidget: DashboardWidgetKey, targetWidget: DashboardWidgetKey) => {
      let nextLayout: DashboardWidgetKey[] | null = null;

      setWidgetOrder((prev) => {
        const fromIndex = prev.indexOf(sourceWidget);
        const toIndex = prev.indexOf(targetWidget);

        if (fromIndex < 0 || toIndex < 0 || fromIndex === toIndex) {
          return prev;
        }

        nextLayout = moveWidget(prev, fromIndex, toIndex);
        return nextLayout;
      });

      if (nextLayout && userId) {
        saveLayoutMutation.mutate(nextLayout);
      }
    },
    [saveLayoutMutation, userId]
  );

  const renderWidget = (widget: DashboardWidgetKey) => {
    if (widget === "kpis") {
      if (isLoading) {
        return (
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            {Array.from({ length: 4 }).map((_, index) => (
              <Skeleton key={index} className="h-28" />
            ))}
          </div>
        );
      }

      return (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            title="Total products"
            value={metrics.totalProducts}
            icon={Boxes}
            trend={trendFromValue(comparisons.productsPct)}
            highlight={`${comparisons.productsPct >= 0 ? "+" : ""}${comparisons.productsPct}% vs previous ${RANGE_LABELS[range]}`}
          />
          <StatCard
            title="Inventory units"
            value={metrics.totalInventory}
            icon={PackageCheck}
            trend={trendFromValue(comparisons.inventoryPct)}
            highlight={`${comparisons.inventoryPct >= 0 ? "+" : ""}${comparisons.inventoryPct}% vs previous ${RANGE_LABELS[range]}`}
          />
          <StatCard
            title="Revenue projection"
            value={metrics.monthlyRevenue}
            prefix="$"
            icon={DollarSign}
            trend={trendFromValue(comparisons.revenuePct)}
            highlight={`${comparisons.revenuePct >= 0 ? "+" : ""}${comparisons.revenuePct}% vs previous ${RANGE_LABELS[range]}`}
          />
          <StatCard
            title="Growth trend"
            value={metrics.growthPercentage}
            suffix="%"
            icon={Users}
            trend={trendFromValue(comparisons.growthDelta)}
            highlight={`${comparisons.growthDelta >= 0 ? "+" : ""}${comparisons.growthDelta} pts vs previous ${RANGE_LABELS[range]}`}
          />
        </div>
      );
    }

    if (widget === "revenue") {
      return <RevenueChart data={chartData} />;
    }

    if (widget === "status") {
      return (
        <Card className="p-1">
          <CardHeader>
            <CardTitle>Status distribution</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {statusRows.map((status, index) => {
              const percentage = metrics.totalProducts > 0 ? Math.round((status.count / metrics.totalProducts) * 100) : 0;

              return (
                <div key={status.key} className="space-y-1.5">
                  <div className="flex items-center justify-between text-sm">
                    <p className="font-medium">{status.label}</p>
                    <p className="text-muted-foreground">
                      {status.count} ({percentage}%)
                    </p>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <motion.div
                      className={cn("h-full rounded-full", status.tone)}
                      initial={{ width: 0 }}
                      animate={{ width: `${percentage}%` }}
                      transition={{ duration: 0.45, delay: index * 0.08 }}
                    />
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      );
    }

    if (widget === "activity") {
      return <ActivityFeed items={data?.activity ?? []} />;
    }

    return (
      <Card className="p-1">
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Top products</CardTitle>
          <Button asChild size="sm" variant="ghost">
            <Link href="/products">
              View all
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-3">
          {topProducts.length === 0 && <p className="text-sm text-muted-foreground">No product records yet.</p>}
          {topProducts.map((product) => (
            <motion.div
              key={product._id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-[minmax(0,1fr)_auto_auto] items-center gap-3 rounded-xl border border-border bg-card p-3"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{product.name}</p>
                <p className="mt-1 text-xs text-muted-foreground">{product.category}</p>
              </div>
              <div className="justify-self-start">
                <Badge variant={product.status === "active" ? "success" : product.status === "draft" ? "warning" : "neutral"}>
                  {product.status}
                </Badge>
              </div>
              <div className="text-right">
                <p className="text-sm font-semibold">${product.price.toLocaleString("en-US")}</p>
                <p className={cn("text-xs", product.stock <= 20 ? "text-warning" : "text-muted-foreground")}>
                  {product.stock} in stock
                </p>
              </div>
            </motion.div>
          ))}

          <div className="rounded-xl border border-border/60 bg-card/60 p-3">
            <p className="flex items-center gap-2 text-sm font-medium">
              <PackageX className="h-4 w-4 text-warning" />
              Inventory watchlist
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {lowStockCount === 0
                ? "No low-stock items in this snapshot."
                : `${lowStockCount} products need replenishment attention.`}
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <section className="space-y-4">
      <TopNav />

      <Card className="relative overflow-hidden p-1">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_80%_20%,hsl(var(--primary)/0.2),transparent_42%)]" />
        <CardContent className="relative grid gap-4 p-6 lg:grid-cols-[1.2fr_0.8fr] lg:items-end">
          <div>
            <Badge variant="info" className="inline-flex items-center gap-1.5">
              <Activity className="h-3.5 w-3.5" />
              Realtime workspace
            </Badge>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight">Welcome back, {user?.name?.split(" ")[0] ?? "there"}.</h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Your catalog pulse is live. Switch time windows, compare trends, and drag widgets to tailor your command center.
            </p>
            <div className="mt-5 flex flex-wrap items-center gap-2">
              <Button asChild>
                <Link href="/products/new">
                  Add Product
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/team">Manage Team</Link>
              </Button>
              <Button variant="ghost" onClick={refresh} disabled={isFetching}>
                <RefreshCw className={cn("h-4 w-4", isFetching && "animate-spin")} />
                {isFetching ? "Syncing..." : "Sync now"}
              </Button>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
            <div className="rounded-xl border border-border/60 bg-card/70 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Active share</p>
              <p className="mt-1 text-2xl font-semibold">{activeShare}%</p>
              <p className="text-xs text-muted-foreground">{statusCounts.active} active products</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/70 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Low stock watch</p>
              <p className="mt-1 text-2xl font-semibold">{lowStockCount}</p>
              <p className="text-xs text-muted-foreground">Products at or below 20 units</p>
            </div>
            <div className="rounded-xl border border-border/60 bg-card/70 p-3">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">Avg price</p>
              <p className="mt-1 text-2xl font-semibold">${averagePrice.toLocaleString("en-US")}</p>
              <p className="text-xs text-muted-foreground">Based on top priced products</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="inline-flex rounded-xl border border-border bg-card/60 p-1">
          {DASHBOARD_RANGES.map((option) => (
            <button
              key={option}
              onClick={() => setRange(option)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                range === option ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {RANGE_LABELS[option]}
            </button>
          ))}
        </div>
        <div className="text-xs text-muted-foreground">Drag widgets by their handles to reorder this dashboard.</div>
      </div>

      {(layoutMessage || saveLayoutMutation.isPending) && (
        <div className="text-xs text-muted-foreground">
          {saveLayoutMutation.isPending ? "Saving layout..." : layoutMessage}
        </div>
      )}

      {isError && (
        <Card className="border border-danger/40 p-1">
          <CardContent className="flex flex-wrap items-center justify-between gap-3 p-4">
            <div className="flex items-center gap-2 text-sm text-danger">
              <CircleAlert className="h-4 w-4" />
              <span>{error instanceof Error ? error.message : "Failed to load dashboard data."}</span>
            </div>
            <Button variant="outline" size="sm" onClick={refresh}>
              Retry
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        {widgetOrder.map((widget) => (
          <div
            key={widget}
            draggable
            onDragStart={() => setDraggingWidget(widget)}
            onDragEnd={() => setDraggingWidget(null)}
            onDragOver={(event) => event.preventDefault()}
            onDrop={() => {
              if (!draggingWidget) return;
              reorderWidgets(draggingWidget, widget);
              setDraggingWidget(null);
            }}
            className={cn(
              "rounded-2xl border border-transparent transition-colors",
              WIDGET_SPAN[widget],
              draggingWidget === widget && "opacity-60",
              draggingWidget && draggingWidget !== widget && "border-primary/40"
            )}
          >
            <div className="mb-2 flex items-center justify-between px-1">
              <p className="text-xs uppercase tracking-[0.1em] text-muted-foreground">{WIDGET_LABELS[widget]}</p>
              <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                <GripVertical className="h-3.5 w-3.5" />
                Drag
              </span>
            </div>
            {renderWidget(widget)}
          </div>
        ))}
      </div>
    </section>
  );
}
