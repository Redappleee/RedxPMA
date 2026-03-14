import { Response } from "express";

import { AuthRequest } from "@/api/middleware/auth";
import { emitSocketEvent } from "@/api/socket/events";
import ActivityModel from "@/models/Activity";
import SettingsModel, { SETTINGS_DOCUMENT_KEY } from "@/models/Settings";
import { AppSettings, defaultSettings } from "@/types/settings";

const cloneDefaultSettings = () => JSON.parse(JSON.stringify(defaultSettings)) as AppSettings;

const ensureSettingsDocument = async () => {
  const existing = await SettingsModel.findOne({ key: SETTINGS_DOCUMENT_KEY });
  if (existing) return existing;

  return SettingsModel.create({
    key: SETTINGS_DOCUMENT_KEY,
    settings: cloneDefaultSettings()
  });
};

export const getSettings = async (_req: AuthRequest, res: Response) => {
  const settingsDoc = await ensureSettingsDocument();

  return res.json({
    settings: settingsDoc.settings,
    updatedAt: settingsDoc.updatedAt
  });
};

export const updateSettings = async (req: AuthRequest, res: Response) => {
  const settingsDoc = await SettingsModel.findOneAndUpdate(
    { key: SETTINGS_DOCUMENT_KEY },
    {
      settings: req.body as AppSettings,
      updatedBy: req.auth?.userId
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await ActivityModel.create({
    user: req.auth?.userId,
    action: "Updated workspace settings",
    entityType: "system",
    entityId: SETTINGS_DOCUMENT_KEY
  });

  emitSocketEvent("settings:updated", {
    updatedBy: req.auth?.userId
  });

  return res.json({
    message: "Settings updated",
    settings: settingsDoc.settings,
    updatedAt: settingsDoc.updatedAt
  });
};

export const resetSettings = async (req: AuthRequest, res: Response) => {
  const settingsDoc = await SettingsModel.findOneAndUpdate(
    { key: SETTINGS_DOCUMENT_KEY },
    {
      settings: cloneDefaultSettings(),
      updatedBy: req.auth?.userId
    },
    { new: true, upsert: true, setDefaultsOnInsert: true }
  );

  await ActivityModel.create({
    user: req.auth?.userId,
    action: "Reset workspace settings",
    entityType: "system",
    entityId: SETTINGS_DOCUMENT_KEY
  });

  emitSocketEvent("settings:updated", {
    updatedBy: req.auth?.userId,
    reset: true
  });

  return res.json({
    message: "Settings reset to defaults",
    settings: settingsDoc.settings,
    updatedAt: settingsDoc.updatedAt
  });
};
