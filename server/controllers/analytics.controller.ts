import { Request, Response } from "express";
import { Types } from "mongoose";

import { analyticsQuerySchema } from "@/server/config/validators";
import { AuthRequest } from "@/server/middleware/auth";
import AnalyticsPreferenceModel, { toAnalyticsPreset } from "@/models/AnalyticsPreference";
import ProductModel from "@/models/Product";
import { DashboardRange, DASHBOARD_RANGE_DAYS } from "@/types/dashboard";

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toPctChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
};

const addMonths = (date: Date, months: number) => {
  const next = new Date(date);
  next.setMonth(next.getMonth() + months);
  return next;
};

const getMonthKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

const getMonthLabel = (date: Date) =>
  date.toLocaleDateString("en-US", {
    month: "short",
    year: "numeric"
  });

const buildBaseFilter = ({
  category,
  status,
  managerId
}: {
  category?: string;
  status?: "active" | "draft" | "archived";
  managerId?: string;
}) => {
  const filter: Record<string, unknown> = {};

  if (category) {
    filter.category = category;
  }

  if (status) {
    filter.status = status;
  }

  if (managerId) {
    filter.assignedManagers = new Types.ObjectId(managerId);
  }

  return filter;
};

const metricAggregationPipeline = (match: Record<string, unknown>) => [
  { $match: match },
  {
    $group: {
      _id: null,
      products: { $sum: 1 },
      inventory: { $sum: "$stock" },
      revenue: { $sum: { $multiply: ["$price", "$stock", 0.02] } },
      active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } }
    }
  }
];

const getLinearForecast = (values: number[], futureDays: number) => {
  if (values.length === 0) {
    return 0;
  }

  if (values.length === 1) {
    return Math.max(0, Math.round(values[0] * futureDays));
  }

  const n = values.length;
  const sumX = (n * (n - 1)) / 2;
  const sumY = values.reduce((acc, value) => acc + value, 0);
  const sumXY = values.reduce((acc, value, index) => acc + index * value, 0);
  const sumXX = values.reduce((acc, _value, index) => acc + index * index, 0);
  const denominator = n * sumXX - sumX * sumX;

  if (denominator === 0) {
    return Math.max(0, Math.round(sumY / n) * futureDays);
  }

  const slope = (n * sumXY - sumX * sumY) / denominator;
  const intercept = (sumY - slope * sumX) / n;

  let total = 0;
  for (let i = n; i < n + futureDays; i += 1) {
    total += Math.max(0, intercept + slope * i);
  }

  return Math.round(total);
};

const getAnomalies = (timeseries: Array<{ date: string; label: string; products: number; revenue: number }>) => {
  const revenueValues = timeseries.map((item) => item.revenue);
  const productValues = timeseries.map((item) => item.products);

  const mean = (values: number[]) => (values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0);
  const stdev = (values: number[]) => {
    if (values.length <= 1) return 0;
    const avg = mean(values);
    const variance = values.reduce((acc, value) => acc + (value - avg) ** 2, 0) / values.length;
    return Math.sqrt(variance);
  };

  const revenueMean = mean(revenueValues);
  const revenueStd = stdev(revenueValues);
  const productsMean = mean(productValues);
  const productsStd = stdev(productValues);

  return timeseries
    .flatMap((point) => {
      const revenueZ = revenueStd > 0 ? (point.revenue - revenueMean) / revenueStd : 0;
      const productsZ = productsStd > 0 ? (point.products - productsMean) / productsStd : 0;
      const anomalies: Array<{
        date: string;
        label: string;
        metric: "revenue" | "products";
        value: number;
        zScore: number;
        severity: "moderate" | "high";
      }> = [];

      if (Math.abs(revenueZ) >= 2) {
        anomalies.push({
          date: point.date,
          label: point.label,
          metric: "revenue",
          value: point.revenue,
          zScore: Number(revenueZ.toFixed(2)),
          severity: Math.abs(revenueZ) >= 3 ? "high" : "moderate"
        });
      }

      if (Math.abs(productsZ) >= 2) {
        anomalies.push({
          date: point.date,
          label: point.label,
          metric: "products",
          value: point.products,
          zScore: Number(productsZ.toFixed(2)),
          severity: Math.abs(productsZ) >= 3 ? "high" : "moderate"
        });
      }

      return anomalies;
    })
    .slice(0, 12);
};

const toCsv = ({
  summaryRows,
  timeseriesRows,
  anomalyRows
}: {
  summaryRows: Array<{ metric: string; value: string | number }>;
  timeseriesRows: Array<{ date: string; products: number; revenue: number }>;
  anomalyRows: Array<{ date: string; metric: string; value: number; zScore: number; severity: string }>;
}) => {
  const lines: string[] = [];
  lines.push("Section,Metric,Value");
  summaryRows.forEach((row) => lines.push(`summary,${row.metric},${row.value}`));
  lines.push("");
  lines.push("Timeseries Date,Products,Revenue");
  timeseriesRows.forEach((row) => lines.push(`${row.date},${row.products},${row.revenue}`));
  lines.push("");
  lines.push("Anomaly Date,Metric,Value,Z Score,Severity");
  anomalyRows.forEach((row) => lines.push(`${row.date},${row.metric},${row.value},${row.zScore},${row.severity}`));

  return lines.join("\n");
};

const ensurePreference = async (userId: string) => {
  const existing = await AnalyticsPreferenceModel.findOne({ user: userId });
  if (existing) return existing;

  return AnalyticsPreferenceModel.create({ user: userId });
};

const getAnalyticsPayload = async ({
  userId,
  range,
  category,
  status,
  managerId
}: {
  userId: string;
  range: DashboardRange;
  category?: string;
  status?: "active" | "draft" | "archived";
  managerId?: string;
}) => {
  const days = DASHBOARD_RANGE_DAYS[range];
  const now = new Date();
  const currentStart = new Date(now.getTime() - days * DAY_IN_MS);
  const previousStart = new Date(currentStart.getTime() - days * DAY_IN_MS);

  const quarterShiftMs = 90 * DAY_IN_MS;
  const previousQuarterStart = new Date(currentStart.getTime() - quarterShiftMs);
  const previousQuarterEnd = new Date(now.getTime() - quarterShiftMs);

  const baseFilter = buildBaseFilter({ category, status, managerId });
  const currentMatch = {
    ...baseFilter,
    createdAt: { $gte: currentStart, $lte: now }
  };
  const previousMatch = {
    ...baseFilter,
    createdAt: { $gte: previousStart, $lt: currentStart }
  };
  const quarterMatch = {
    ...baseFilter,
    createdAt: { $gte: previousQuarterStart, $lte: previousQuarterEnd }
  };

  const [preference, currentMetricsAgg, previousMetricsAgg, quarterMetricsAgg, statusMixRaw, timeseriesRaw, categoryBreakdown, managerBreakdown, topProducts, inventoryAgg, cohortProducts] =
    await Promise.all([
      ensurePreference(userId),
      ProductModel.aggregate(metricAggregationPipeline(currentMatch)),
      ProductModel.aggregate(metricAggregationPipeline(previousMatch)),
      ProductModel.aggregate(metricAggregationPipeline(quarterMatch)),
      ProductModel.aggregate([
        { $match: currentMatch },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]),
      ProductModel.aggregate([
        { $match: currentMatch },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt"
              }
            },
            products: { $sum: 1 },
            revenue: { $sum: { $multiply: ["$price", "$stock", 0.02] } }
          }
        },
        { $sort: { _id: 1 } }
      ]),
      ProductModel.aggregate([
        { $match: currentMatch },
        {
          $group: {
            _id: "$category",
            count: { $sum: 1 },
            revenue: { $sum: { $multiply: ["$price", "$stock", 0.02] } }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 8 }
      ]),
      ProductModel.aggregate([
        { $match: { ...currentMatch, assignedManagers: { $exists: true, $ne: [] } } },
        { $unwind: "$assignedManagers" },
        {
          $group: {
            _id: "$assignedManagers",
            count: { $sum: 1 },
            revenue: { $sum: { $multiply: ["$price", "$stock", 0.02] } }
          }
        },
        { $lookup: { from: "users", localField: "_id", foreignField: "_id", as: "manager" } },
        {
          $project: {
            _id: 0,
            managerId: { $toString: "$_id" },
            name: { $ifNull: [{ $arrayElemAt: ["$manager.name", 0] }, "Unknown"] },
            count: 1,
            revenue: { $round: ["$revenue", 0] }
          }
        },
        { $sort: { revenue: -1 } },
        { $limit: 10 }
      ]),
      ProductModel.find(currentMatch).sort({ price: -1 }).limit(10).select("name category status stock price createdAt assignedManagers").lean(),
      ProductModel.aggregate([
        { $match: currentMatch },
        {
          $group: {
            _id: null,
            total: { $sum: 1 },
            totalStock: { $sum: "$stock" },
            lowStock: {
              $sum: {
                $cond: [{ $and: [{ $lte: ["$stock", 20] }, { $ne: ["$status", "archived"] }] }, 1, 0]
              }
            },
            overstock: { $sum: { $cond: [{ $gte: ["$stock", 500] }, 1, 0] } },
            agingRisk: {
              $sum: {
                $cond: [{ $and: [{ $lte: ["$createdAt", new Date(now.getTime() - 120 * DAY_IN_MS)] }, { $gte: ["$stock", 80] }] }, 1, 0]
              }
            }
          }
        }
      ]),
      ProductModel.find({
        ...baseFilter,
        createdAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 5, 1) }
      })
        .select("createdAt updatedAt status")
        .lean()
    ]);

  const currentMetrics = currentMetricsAgg[0] ?? { products: 0, inventory: 0, revenue: 0, active: 0 };
  const previousMetrics = previousMetricsAgg[0] ?? { products: 0, inventory: 0, revenue: 0, active: 0 };
  const quarterMetrics = quarterMetricsAgg[0] ?? { products: 0, inventory: 0, revenue: 0, active: 0 };
  const currentGrowth = currentMetrics.products > 0 ? Math.round((currentMetrics.active / currentMetrics.products) * 100) : 0;
  const previousGrowth = previousMetrics.products > 0 ? Math.round((previousMetrics.active / previousMetrics.products) * 100) : 0;
  const quarterGrowth = quarterMetrics.products > 0 ? Math.round((quarterMetrics.active / quarterMetrics.products) * 100) : 0;

  const statusMix = statusMixRaw.reduce(
    (acc, item) => {
      acc[item._id as "active" | "draft" | "archived"] = item.count as number;
      return acc;
    },
    { active: 0, draft: 0, archived: 0 } as Record<"active" | "draft" | "archived", number>
  );

  const timeseriesMap = new Map(
    timeseriesRaw.map((item) => [item._id as string, { products: item.products as number, revenue: Math.round(item.revenue as number) }])
  );
  const timeseries = Array.from({ length: days }).map((_, index) => {
    const date = new Date(currentStart.getTime() + index * DAY_IN_MS);
    const isoDate = date.toISOString().slice(0, 10);
    const row = timeseriesMap.get(isoDate);

    return {
      date: isoDate,
      label: date.toLocaleDateString("en-US", { month: "short", day: "numeric" }),
      products: row?.products ?? 0,
      revenue: row?.revenue ?? 0
    };
  });

  const revenueSeries = timeseries.map((row) => row.revenue);
  const forecast7 = getLinearForecast(revenueSeries, 7);
  const forecast30 = getLinearForecast(revenueSeries, 30);
  const forecast90 = getLinearForecast(revenueSeries, 90);

  const inventory = inventoryAgg[0] ?? { total: 0, totalStock: 0, lowStock: 0, overstock: 0, agingRisk: 0 };
  const riskFactor =
    (inventory.lowStock * 2 + inventory.overstock * 1.2 + inventory.agingRisk * 1.6) / Math.max(1, inventory.total);
  const healthScore = Math.max(0, Math.min(100, Math.round(100 - riskFactor * 18)));
  const stockTurnover = Number(((currentMetrics.products / Math.max(1, currentMetrics.inventory)) * 1000).toFixed(1));

  const mrr = Math.round(currentMetrics.revenue);
  const arr = mrr * 12;

  const anomalies = getAnomalies(timeseries);

  const funnel = {
    draft: statusMix.draft,
    active: statusMix.active,
    archived: statusMix.archived,
    draftToActiveRate: statusMix.draft > 0 ? Math.round((statusMix.active / statusMix.draft) * 100) : 0,
    activeToArchivedRate: statusMix.active > 0 ? Math.round((statusMix.archived / statusMix.active) * 100) : 0,
    draftToArchivedRate: statusMix.draft > 0 ? Math.round((statusMix.archived / statusMix.draft) * 100) : 0
  };

  const cohortMonthStarts = Array.from({ length: 6 }).map((_, index) => {
    const month = new Date(now.getFullYear(), now.getMonth() - (5 - index), 1);
    return month;
  });
  const cohortMap = new Map(
    cohortMonthStarts.map((monthStart) => [
      getMonthKey(monthStart),
      { monthStart, label: getMonthLabel(monthStart), size: 0, retainedM1: 0, retainedM2: 0, retainedM3: 0 }
    ])
  );

  cohortProducts.forEach((product) => {
    const createdAt = new Date(product.createdAt as unknown as string);
    const key = getMonthKey(new Date(createdAt.getFullYear(), createdAt.getMonth(), 1));
    const cohort = cohortMap.get(key);
    if (!cohort) return;

    cohort.size += 1;
    const updatedAt = new Date(product.updatedAt as unknown as string);
    const isArchived = product.status === "archived";
    if (!isArchived && updatedAt >= addMonths(cohort.monthStart, 1)) cohort.retainedM1 += 1;
    if (!isArchived && updatedAt >= addMonths(cohort.monthStart, 2)) cohort.retainedM2 += 1;
    if (!isArchived && updatedAt >= addMonths(cohort.monthStart, 3)) cohort.retainedM3 += 1;
  });

  const cohorts = Array.from(cohortMap.values()).map((row) => {
    const elapsedMonths = (now.getFullYear() - row.monthStart.getFullYear()) * 12 + (now.getMonth() - row.monthStart.getMonth());
    const toRate = (value: number) => (row.size > 0 ? Math.round((value / row.size) * 100) : 0);

    return {
      month: row.label,
      size: row.size,
      m1: elapsedMonths >= 1 ? toRate(row.retainedM1) : null,
      m2: elapsedMonths >= 2 ? toRate(row.retainedM2) : null,
      m3: elapsedMonths >= 3 ? toRate(row.retainedM3) : null
    };
  });

  const goals = preference.goals;
  const goalProgress = {
    revenue: {
      target: goals.revenueTarget,
      current: mrr,
      progressPct: goals.revenueTarget > 0 ? Math.round((mrr / goals.revenueTarget) * 100) : 0
    },
    activeProducts: {
      target: goals.activeProductsTarget,
      current: statusMix.active,
      progressPct: goals.activeProductsTarget > 0 ? Math.round((statusMix.active / goals.activeProductsTarget) * 100) : 0
    },
    stockTurnover: {
      target: goals.stockTurnoverTarget,
      current: stockTurnover,
      progressPct: goals.stockTurnoverTarget > 0 ? Math.round((stockTurnover / goals.stockTurnoverTarget) * 100) : 0
    }
  };

  return {
    range,
    filters: { category, status, managerId },
    metrics: {
      mrr,
      arr,
      totalProducts: currentMetrics.products,
      totalInventory: currentMetrics.inventory,
      growthPercentage: currentGrowth
    },
    comparisons: {
      previousPeriod: {
        revenuePct: toPctChange(currentMetrics.revenue, previousMetrics.revenue),
        productsPct: toPctChange(currentMetrics.products, previousMetrics.products),
        inventoryPct: toPctChange(currentMetrics.inventory, previousMetrics.inventory),
        growthDelta: currentGrowth - previousGrowth
      },
      lastQuarterEquivalent: {
        revenuePct: toPctChange(currentMetrics.revenue, quarterMetrics.revenue),
        productsPct: toPctChange(currentMetrics.products, quarterMetrics.products),
        inventoryPct: toPctChange(currentMetrics.inventory, quarterMetrics.inventory),
        growthDelta: currentGrowth - quarterGrowth
      }
    },
    forecasts: {
      next7Days: { revenue: forecast7, lower: Math.round(forecast7 * 0.85), upper: Math.round(forecast7 * 1.15) },
      next30Days: { revenue: forecast30, lower: Math.round(forecast30 * 0.85), upper: Math.round(forecast30 * 1.15) },
      next90Days: { revenue: forecast90, lower: Math.round(forecast90 * 0.85), upper: Math.round(forecast90 * 1.15) }
    },
    inventoryHealth: {
      score: healthScore,
      lowStock: inventory.lowStock,
      overstock: inventory.overstock,
      agingRisk: inventory.agingRisk,
      stockTurnover
    },
    funnel,
    cohorts,
    anomalies,
    timeseries,
    segments: {
      categories: categoryBreakdown.map((item) => ({
        category: String(item._id ?? "Uncategorized"),
        count: item.count as number,
        revenue: Math.round(item.revenue as number)
      })),
      managers: managerBreakdown
    },
    topProducts,
    goals: {
      targets: goals,
      progress: goalProgress
    },
    presets: preference.presets.map((preset) => toAnalyticsPreset(preset)),
    schedule: preference.schedule
  };
};

export const getAnalyticsOverview = async (req: AuthRequest, res: Response) => {
  const parsedQueryResult = analyticsQuerySchema.safeParse(req.query);
  if (!parsedQueryResult.success) {
    return res.status(400).json({
      message: "Validation error",
      errors: parsedQueryResult.error.flatten().fieldErrors
    });
  }
  const parsedQuery = parsedQueryResult.data;
  const payload = await getAnalyticsPayload({
    userId: req.auth!.userId,
    range: parsedQuery.range,
    category: parsedQuery.category,
    status: parsedQuery.status,
    managerId: parsedQuery.managerId
  });

  return res.json(payload);
};

export const updateAnalyticsGoals = async (req: AuthRequest, res: Response) => {
  const preference = await ensurePreference(req.auth!.userId);
  preference.goals = req.body;
  await preference.save();

  return res.json({ goals: preference.goals });
};

export const createAnalyticsPreset = async (req: AuthRequest, res: Response) => {
  const preference = await ensurePreference(req.auth!.userId);

  preference.presets.unshift({
    name: req.body.name,
    range: req.body.range,
    filters: req.body.filters,
    sortBy: req.body.sortBy,
    createdAt: new Date()
  } as never);

  if (preference.presets.length > 15) {
    preference.presets = preference.presets.slice(0, 15);
  }

  await preference.save();

  return res.status(201).json({
    presets: preference.presets.map((preset) => toAnalyticsPreset(preset))
  });
};

export const deleteAnalyticsPreset = async (req: AuthRequest, res: Response) => {
  const preference = await ensurePreference(req.auth!.userId);
  const nextPresets = preference.presets.filter((preset) => preset._id.toString() !== req.params.presetId);

  if (nextPresets.length === preference.presets.length) {
    return res.status(404).json({ message: "Preset not found" });
  }

  preference.presets = nextPresets as never;
  await preference.save();

  return res.json({
    presets: preference.presets.map((preset) => toAnalyticsPreset(preset))
  });
};

export const updateAnalyticsSchedule = async (req: AuthRequest, res: Response) => {
  const preference = await ensurePreference(req.auth!.userId);
  preference.schedule = req.body;
  await preference.save();

  return res.json({ schedule: preference.schedule });
};

export const exportAnalyticsReport = async (req: AuthRequest, res: Response) => {
  const parsedQueryResult = analyticsQuerySchema.safeParse(req.query);
  if (!parsedQueryResult.success) {
    return res.status(400).json({
      message: "Validation error",
      errors: parsedQueryResult.error.flatten().fieldErrors
    });
  }
  const parsedQuery = parsedQueryResult.data;
  const format = String(req.query.format ?? "csv").toLowerCase();

  const payload = await getAnalyticsPayload({
    userId: req.auth!.userId,
    range: parsedQuery.range,
    category: parsedQuery.category,
    status: parsedQuery.status,
    managerId: parsedQuery.managerId
  });

  if (format === "json") {
    return res.json(payload);
  }

  const csv = toCsv({
    summaryRows: [
      { metric: "range", value: payload.range },
      { metric: "mrr", value: payload.metrics.mrr },
      { metric: "arr", value: payload.metrics.arr },
      { metric: "totalProducts", value: payload.metrics.totalProducts },
      { metric: "inventory", value: payload.metrics.totalInventory },
      { metric: "growth", value: payload.metrics.growthPercentage },
      { metric: "healthScore", value: payload.inventoryHealth.score }
    ],
    timeseriesRows: payload.timeseries.map((row) => ({
      date: row.date,
      products: row.products,
      revenue: row.revenue
    })),
    anomalyRows: payload.anomalies.map((item) => ({
      date: item.date,
      metric: item.metric,
      value: item.value,
      zScore: item.zScore,
      severity: item.severity
    }))
  });

  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader(
    "Content-Disposition",
    `attachment; filename="analytics-report-${payload.range}-${new Date().toISOString().slice(0, 10)}.csv"`
  );
  return res.status(200).send(csv);
};
