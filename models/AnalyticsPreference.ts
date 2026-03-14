import { Document, Model, Schema, model, models } from "mongoose";

import { AnalyticsGoals, AnalyticsPreset, AnalyticsSchedule } from "@/types/analytics";
import { DashboardRange } from "@/types/dashboard";
import { ProductStatus } from "@/types";

export interface IAnalyticsPreset {
  _id: Schema.Types.ObjectId;
  name: string;
  range: DashboardRange;
  filters: {
    category?: string;
    status?: ProductStatus;
    managerId?: string;
  };
  sortBy: "revenue" | "inventory" | "growth";
  createdAt: Date;
}

export interface IAnalyticsPreferenceDocument extends Document {
  user: Schema.Types.ObjectId;
  goals: AnalyticsGoals;
  presets: IAnalyticsPreset[];
  schedule: AnalyticsSchedule;
  createdAt: Date;
  updatedAt: Date;
}

const PresetSchema = new Schema<IAnalyticsPreset>(
  {
    name: { type: String, required: true, trim: true, minlength: 2, maxlength: 60 },
    range: { type: String, enum: ["7d", "30d", "90d"], default: "30d" },
    filters: {
      category: { type: String, trim: true },
      status: { type: String, enum: ["active", "draft", "archived"] },
      managerId: { type: String }
    },
    sortBy: { type: String, enum: ["revenue", "inventory", "growth"], default: "revenue" },
    createdAt: { type: Date, default: Date.now }
  },
  { _id: true, id: false }
);

const AnalyticsPreferenceSchema = new Schema<IAnalyticsPreferenceDocument>(
  {
    user: { type: Schema.Types.ObjectId, ref: "User", required: true, unique: true, index: true },
    goals: {
      revenueTarget: { type: Number, min: 0, default: 50000 },
      activeProductsTarget: { type: Number, min: 0, default: 100 },
      stockTurnoverTarget: { type: Number, min: 0, default: 15 }
    },
    presets: { type: [PresetSchema], default: [] },
    schedule: {
      enabled: { type: Boolean, default: false },
      frequency: { type: String, enum: ["weekly", "monthly"], default: "weekly" },
      channel: { type: String, enum: ["email", "slack"], default: "email" },
      destination: { type: String, default: "" },
      weekday: { type: Number, min: 0, max: 6, default: 1 },
      hour: { type: Number, min: 0, max: 23, default: 9 }
    }
  },
  { timestamps: true }
);

const AnalyticsPreferenceModel =
  (models.AnalyticsPreference as Model<IAnalyticsPreferenceDocument>) ||
  model<IAnalyticsPreferenceDocument>("AnalyticsPreference", AnalyticsPreferenceSchema);

export default AnalyticsPreferenceModel;

export const toAnalyticsPreset = (preset: IAnalyticsPreset): AnalyticsPreset => ({
  id: preset._id.toString(),
  name: preset.name,
  range: preset.range,
  filters: {
    category: preset.filters.category,
    status: preset.filters.status,
    managerId: preset.filters.managerId
  },
  sortBy: preset.sortBy,
  createdAt: preset.createdAt.toISOString()
});
