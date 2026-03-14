import SettingsModel, { SETTINGS_DOCUMENT_KEY } from "@/models/Settings";
import { AppSettings, defaultSettings } from "@/types/settings";

const cloneDefaults = () => JSON.parse(JSON.stringify(defaultSettings)) as AppSettings;

export const getWorkspaceSettings = async () => {
  const settingsDoc = await SettingsModel.findOne({ key: SETTINGS_DOCUMENT_KEY }).lean();

  if (!settingsDoc?.settings) {
    return cloneDefaults();
  }

  return settingsDoc.settings as AppSettings;
};
