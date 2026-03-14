import { Document, Model, Schema, model, models } from "mongoose";

import { AppSettings, defaultSettings } from "@/types/settings";

const SETTINGS_KEY = "global";

const cloneDefaultSettings = () => JSON.parse(JSON.stringify(defaultSettings)) as AppSettings;

export interface ISettingsDocument extends Document {
  key: string;
  settings: AppSettings;
  updatedBy?: Schema.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SettingsSchema = new Schema<ISettingsDocument>(
  {
    key: { type: String, required: true, unique: true, default: SETTINGS_KEY },
    settings: { type: Schema.Types.Mixed, required: true, default: cloneDefaultSettings },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" }
  },
  { timestamps: true, minimize: false }
);

export const SETTINGS_DOCUMENT_KEY = SETTINGS_KEY;

const SettingsModel =
  (models.Settings as Model<ISettingsDocument>) || model<ISettingsDocument>("Settings", SettingsSchema);

export default SettingsModel;
