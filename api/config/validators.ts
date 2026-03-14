import { z } from "zod";

import {
  DASHBOARD_RANGES,
  DASHBOARD_WIDGET_KEYS,
  DEFAULT_DASHBOARD_LAYOUT
} from "@/types/dashboard";

const objectIdSchema = z
  .string()
  .regex(/^[a-fA-F0-9]{24}$/, "Must be a valid Mongo ObjectId");

export const signupSchema = z.object({
  name: z.string().min(2).max(80),
  email: z.string().email(),
  password: z
    .string()
    .min(8)
    .regex(/[A-Z]/, "Must include uppercase")
    .regex(/[a-z]/, "Must include lowercase")
    .regex(/[0-9]/, "Must include number"),
  role: z.enum(["admin", "manager", "member"]).default("member")
});

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8)
});

export const googleAuthSchema = z.object({
  idToken: z.string().min(20),
  role: z.enum(["admin", "manager", "member"]).optional()
});

export const productSchema = z.object({
  name: z.string().min(2).max(120),
  description: z.string().min(12).max(1200),
  category: z.string().min(2).max(80),
  price: z.coerce.number().min(0),
  stock: z.coerce.number().int().min(0),
  status: z.enum(["active", "draft", "archived"]),
  image: z.string().url().optional(),
  assignedManagers: z.array(objectIdSchema).optional().default([])
});

export const productUpdateSchema = productSchema.partial();

export const commentSchema = z.object({
  message: z.string().min(1).max(500)
});

export const inviteSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  role: z.enum(["manager", "member"])
});

export const updateUserRoleSchema = z.object({
  role: z.enum(["admin", "manager", "member"])
});

export const forgotPasswordSchema = z.object({
  email: z.string().email()
});

export const resetPasswordSchema = z.object({
  token: z.string().min(8),
  password: z.string().min(8)
});

export const dashboardRangeSchema = z.enum(DASHBOARD_RANGES);

export const dashboardLayoutSchema = z
  .object({
    layout: z.array(z.enum(DASHBOARD_WIDGET_KEYS)).length(DEFAULT_DASHBOARD_LAYOUT.length)
  })
  .superRefine((value, ctx) => {
    const layoutSet = new Set(value.layout);
    const defaultSet = new Set(DEFAULT_DASHBOARD_LAYOUT);

    if (layoutSet.size !== DEFAULT_DASHBOARD_LAYOUT.length) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Layout contains duplicate widgets",
        path: ["layout"]
      });
      return;
    }

    for (const widget of defaultSet) {
      if (!layoutSet.has(widget)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `Missing widget: ${widget}`,
          path: ["layout"]
        });
        return;
      }
    }
  });

const analyticsFiltersSchema = z.object({
  category: z.string().min(2).max(80).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  managerId: objectIdSchema.optional()
});

export const analyticsQuerySchema = z.object({
  range: dashboardRangeSchema.default("30d"),
  category: z.string().min(2).max(80).optional(),
  status: z.enum(["active", "draft", "archived"]).optional(),
  managerId: objectIdSchema.optional()
});

export const analyticsGoalsSchema = z.object({
  revenueTarget: z.coerce.number().min(0).max(1_000_000_000),
  activeProductsTarget: z.coerce.number().int().min(0).max(1_000_000),
  stockTurnoverTarget: z.coerce.number().min(0).max(10000)
});

export const analyticsPresetSchema = z.object({
  name: z.string().min(2).max(60),
  range: dashboardRangeSchema.default("30d"),
  filters: analyticsFiltersSchema.default({}),
  sortBy: z.enum(["revenue", "inventory", "growth"]).default("revenue")
});

export const analyticsScheduleSchema = z.object({
  enabled: z.boolean(),
  frequency: z.enum(["weekly", "monthly"]),
  channel: z.enum(["email", "slack"]),
  destination: z.string().max(160),
  weekday: z.coerce.number().int().min(0).max(6),
  hour: z.coerce.number().int().min(0).max(23)
});

export const settingsSchema = z.object({
  workspace: z.object({
    companyName: z.string().min(2).max(120),
    logoUrl: z.string().url().or(z.literal("")),
    timezone: z.string().min(2).max(120),
    currency: z.enum(["USD", "EUR", "GBP"]),
    dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"])
  }),
  teamPermissions: z.object({
    defaultInviteRole: z.enum(["manager", "member"]),
    membersCanInvite: z.boolean(),
    membersCanDeleteComments: z.boolean()
  }),
  productDefaults: z.object({
    defaultStatus: z.enum(["active", "draft", "archived"]),
    defaultCategory: z.string().min(2).max(80),
    taxRate: z.coerce.number().min(0).max(100),
    lowStockThreshold: z.coerce.number().int().min(0).max(1000000),
    autoArchiveDays: z.coerce.number().int().min(30).max(3650)
  }),
  notifications: z.object({
    emailDigest: z.boolean(),
    productUpdates: z.boolean(),
    commentMentions: z.boolean(),
    inviteAlerts: z.boolean(),
    billingAlerts: z.boolean()
  }),
  security: z.object({
    twoFactorEnabled: z.boolean(),
    loginAlerts: z.boolean(),
    sessionTimeoutMinutes: z.coerce.number().int().min(15).max(1440)
  }),
  appearance: z.object({
    compactMode: z.boolean(),
    reduceMotion: z.boolean(),
    accentColor: z.enum(["blue", "emerald", "orange"])
  }),
  integrations: z.object({
    slackConnected: z.boolean(),
    jiraConnected: z.boolean(),
    notionConnected: z.boolean(),
    githubConnected: z.boolean()
  }),
  billing: z.object({
    plan: z.enum(["Starter", "Growth", "Enterprise"]),
    seats: z.coerce.number().int().min(1).max(100000),
    invoiceEmail: z.string().email()
  })
});
