import { Request, Response } from "express";
import sanitizeHtml from "sanitize-html";

import { getWorkspaceSettings } from "@/server/lib/workspace-settings";
import { AuthRequest } from "@/server/middleware/auth";
import { emitSocketEvent, emitToUser } from "@/server/socket/events";
import ActivityModel from "@/models/Activity";
import NotificationModel from "@/models/Notification";
import ProductModel from "@/models/Product";
import { DASHBOARD_RANGE_DAYS, DASHBOARD_RANGES, DashboardRange } from "@/types/dashboard";

const safe = (value: string) =>
  sanitizeHtml(value, {
    allowedTags: [],
    allowedAttributes: {}
  }).trim();

const populatePaths = [
  { path: "createdBy", select: "name email role avatar" },
  { path: "assignedManagers", select: "name email role avatar" },
  { path: "comments.user", select: "name email role avatar" }
];

const DAY_IN_MS = 24 * 60 * 60 * 1000;

const toYmd = (value: Date) => value.toISOString().slice(0, 10);

const toLabel = (value: Date) =>
  value.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric"
  });

const toPctChange = (current: number, previous: number) => {
  if (previous === 0) {
    return current === 0 ? 0 : 100;
  }

  return Math.round(((current - previous) / previous) * 100);
};

const parseRange = (value: unknown): DashboardRange => {
  if (typeof value === "string" && (DASHBOARD_RANGES as readonly string[]).includes(value)) {
    return value as DashboardRange;
  }

  return "30d";
};

const syncAutoArchivedProducts = async () => {
  const settings = await getWorkspaceSettings();
  const cutoff = new Date(Date.now() - settings.productDefaults.autoArchiveDays * DAY_IN_MS);

  await ProductModel.updateMany(
    {
      status: { $ne: "archived" },
      updatedAt: { $lt: cutoff }
    },
    { $set: { status: "archived" } }
  );

  return settings;
};

export const listProducts = async (req: Request, res: Response) => {
  await syncAutoArchivedProducts();

  const search = req.query.search as string | undefined;
  const category = req.query.category as string | undefined;
  const status = req.query.status as string | undefined;
  const sort = (req.query.sort as string | undefined) ?? "newest";

  const query: Record<string, unknown> = {};

  if (search) {
    query.$text = { $search: safe(search) };
  }

  if (category) {
    query.category = category;
  }

  if (status) {
    query.status = status;
  }

  let sortBy: Record<string, 1 | -1 | { $meta: "textScore" }>;

  if (sort === "price_high") {
    sortBy = { price: -1 };
  } else if (sort === "price_low") {
    sortBy = { price: 1 };
  } else if (sort === "relevance") {
    sortBy = { score: { $meta: "textScore" } };
  } else if (sort === "oldest") {
    sortBy = { createdAt: 1 };
  } else {
    sortBy = { createdAt: -1 };
  }

  const products = await ProductModel.find(query)
    .populate(populatePaths)
    .sort(sortBy)
    .limit(100);

  return res.json({ products });
};

export const createProduct = async (req: AuthRequest, res: Response) => {
  const settings = await getWorkspaceSettings();
  const product = await ProductModel.create({
    ...req.body,
    name: safe(req.body.name),
    description: safe(req.body.description),
    category: safe(req.body.category),
    createdBy: req.auth?.userId
  });

  await ActivityModel.create({
    user: req.auth?.userId,
    action: "Created product",
    entityType: "product",
    entityId: product.id,
    metadata: { productName: product.name }
  });

  if (settings.notifications.productUpdates) {
    const recipients = [...new Set([req.auth?.userId, ...(product.assignedManagers.map((managerId) => managerId.toString()))].filter(Boolean))];

    await Promise.all(
      recipients.map((userId) =>
        NotificationModel.create({
          userId,
          title: "Product created",
          description: `${product.name} was added to the catalog`,
          type: "success"
        })
      )
    );
  }

  emitSocketEvent("product:created", { productId: product.id });

  return res.status(201).json({ product });
};

export const getProduct = async (req: Request, res: Response) => {
  await syncAutoArchivedProducts();

  const product = await ProductModel.findById(req.params.id).populate(populatePaths);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  return res.json({ product });
};

export const updateProduct = async (req: AuthRequest, res: Response) => {
  const settings = await getWorkspaceSettings();
  const payload = {
    ...req.body,
    name: req.body.name ? safe(req.body.name) : undefined,
    description: req.body.description ? safe(req.body.description) : undefined,
    category: req.body.category ? safe(req.body.category) : undefined
  };

  const product = await ProductModel.findByIdAndUpdate(req.params.id, payload, {
    new: true
  }).populate(populatePaths);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await ActivityModel.create({
    user: req.auth?.userId,
    action: "Updated product",
    entityType: "product",
    entityId: product.id,
    metadata: { productName: product.name }
  });

  if (settings.notifications.productUpdates) {
    const recipients = [...new Set([req.auth?.userId, ...(product.assignedManagers.map((manager) => String(manager)))].filter(Boolean))];

    await Promise.all(
      recipients.map((userId) =>
        NotificationModel.create({
          userId,
          title: "Product updated",
          description: `${product.name} was updated`,
          type: "info"
        })
      )
    );
  }

  emitSocketEvent("product:updated", { productId: product.id });

  return res.json({ product });
};

export const deleteProduct = async (req: AuthRequest, res: Response) => {
  const settings = await getWorkspaceSettings();
  const product = await ProductModel.findByIdAndDelete(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  await ActivityModel.create({
    user: req.auth?.userId,
    action: "Deleted product",
    entityType: "product",
    entityId: req.params.id,
    metadata: { productName: product.name }
  });

  if (settings.notifications.productUpdates) {
    await NotificationModel.create({
      userId: req.auth?.userId,
      title: "Product removed",
      description: `${product.name} was deleted from the catalog`,
      type: "warning"
    });
  }

  emitSocketEvent("product:deleted", { productId: req.params.id });

  return res.json({ message: "Product removed" });
};

export const addComment = async (req: AuthRequest, res: Response) => {
  const settings = await getWorkspaceSettings();
  const message = safe(req.body.message);

  const product = await ProductModel.findById(req.params.id);
  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  product.comments.push({
    user: req.auth?.userId as never,
    message,
    createdAt: new Date()
  });

  await product.save();

  await ActivityModel.create({
    user: req.auth?.userId,
    action: "Added comment",
    entityType: "product",
    entityId: product.id,
    metadata: { productName: product.name }
  });

  if (settings.notifications.commentMentions) {
    for (const managerId of product.assignedManagers) {
      await NotificationModel.create({
        userId: managerId,
        title: "New product comment",
        description: `${product.name} has a new comment`,
        type: "info"
      });
      emitToUser(managerId.toString(), "notification:new", {
        title: "New product comment",
        productId: product.id
      });
    }
  }

  emitSocketEvent("product:commented", { productId: product.id });

  return res.status(201).json({ message: "Comment added" });
};

export const deleteComment = async (req: AuthRequest, res: Response) => {
  const settings = await getWorkspaceSettings();
  const product = await ProductModel.findById(req.params.id);

  if (!product) {
    return res.status(404).json({ message: "Product not found" });
  }

  const requester = req.auth?.userId;
  const requesterRole = req.auth?.role;
  const commentIndex = product.comments.findIndex(
    (item) => String((item as { _id?: unknown })._id) === req.params.commentId
  );

  if (commentIndex === -1) {
    return res.status(404).json({ message: "Comment not found" });
  }

  const comment = product.comments[commentIndex];

  const isPrivileged = requesterRole === "admin" || requesterRole === "manager";
  const canDeleteOwnComment = String(comment.user) === requester && settings.teamPermissions.membersCanDeleteComments;

  if (!isPrivileged && !canDeleteOwnComment) {
    return res.status(403).json({ message: "Comment deletion is not allowed under current workspace settings" });
  }

  product.comments.splice(commentIndex, 1);
  await product.save();

  await ActivityModel.create({
    user: requester,
    action: "Deleted comment",
    entityType: "product",
    entityId: product.id,
    metadata: { productName: product.name }
  });

  return res.json({ message: "Comment removed" });
};

export const getDashboardData = async (req: Request, res: Response) => {
  await syncAutoArchivedProducts();

  const range = parseRange(req.query.range);
  const days = DASHBOARD_RANGE_DAYS[range];
  const periodStart = new Date(Date.now() - days * DAY_IN_MS);
  const previousPeriodStart = new Date(Date.now() - days * 2 * DAY_IN_MS);

  const dateRangeFilter = {
    createdAt: {
      $gte: periodStart
    }
  };
  const previousDateRangeFilter = {
    createdAt: {
      $gte: previousPeriodStart,
      $lt: periodStart
    }
  };

  const [totalProducts, inventoryResult, activeResult, activity, currentPeriod, previousPeriod, timeseriesRaw] = await Promise.all([
    ProductModel.countDocuments(),
    ProductModel.aggregate([{ $group: { _id: null, stock: { $sum: "$stock" } } }]),
    ProductModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]),
    ActivityModel.find(dateRangeFilter).sort({ createdAt: -1 }).limit(10).populate("user", "name email role"),
    ProductModel.aggregate([
      { $match: dateRangeFilter },
      {
        $group: {
          _id: null,
          products: { $sum: 1 },
          inventory: { $sum: "$stock" },
          revenue: { $sum: { $multiply: ["$price", "$stock", 0.02] } },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } }
        }
      }
    ]),
    ProductModel.aggregate([
      { $match: previousDateRangeFilter },
      {
        $group: {
          _id: null,
          products: { $sum: 1 },
          inventory: { $sum: "$stock" },
          revenue: { $sum: { $multiply: ["$price", "$stock", 0.02] } },
          active: { $sum: { $cond: [{ $eq: ["$status", "active"] }, 1, 0] } }
        }
      }
    ]),
    ProductModel.aggregate([
      { $match: dateRangeFilter },
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
    ])
  ]);

  let topProducts = await ProductModel.find(dateRangeFilter)
    .sort({ price: -1 })
    .limit(6)
    .select("name price stock status category")
    .lean();

  if (topProducts.length === 0) {
    topProducts = await ProductModel.find().sort({ price: -1 }).limit(6).select("name price stock status category").lean();
  }

  const current = currentPeriod[0] ?? { products: 0, inventory: 0, revenue: 0, active: 0 };
  const previous = previousPeriod[0] ?? { products: 0, inventory: 0, revenue: 0, active: 0 };
  const currentGrowth = current.products > 0 ? Math.round((current.active / current.products) * 100) : 0;
  const previousGrowth = previous.products > 0 ? Math.round((previous.active / previous.products) * 100) : 0;

  const monthlyRevenue = topProducts.reduce((acc, product) => acc + product.price * product.stock * 0.02, 0);
  const growthPercentage = activeResult.length > 0 ? Math.round((activeResult[0].count / totalProducts) * 100) : 0;
  const timeseriesMap = new Map(
    timeseriesRaw.map((item) => [item._id as string, { products: item.products as number, revenue: item.revenue as number }])
  );
  const timeseries = Array.from({ length: days }).map((_, index) => {
    const currentDate = new Date(periodStart.getTime() + index * DAY_IN_MS);
    const ymd = toYmd(currentDate);
    const row = timeseriesMap.get(ymd);

    return {
      date: ymd,
      label: toLabel(currentDate),
      products: row?.products ?? 0,
      revenue: Math.round(row?.revenue ?? 0)
    };
  });

  return res.json({
    range,
    period: {
      currentStart: periodStart,
      currentEnd: new Date(),
      previousStart: previousPeriodStart,
      previousEnd: periodStart
    },
    metrics: {
      totalProducts,
      totalInventory: inventoryResult[0]?.stock ?? 0,
      monthlyRevenue: Math.round(monthlyRevenue),
      growthPercentage
    },
    comparisons: {
      productsPct: toPctChange(current.products, previous.products),
      inventoryPct: toPctChange(current.inventory, previous.inventory),
      revenuePct: toPctChange(current.revenue, previous.revenue),
      growthDelta: currentGrowth - previousGrowth
    },
    activity,
    productMix: activeResult,
    topProducts,
    timeseries
  });
};
