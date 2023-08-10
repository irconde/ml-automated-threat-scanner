import * as fs from "fs";
import * as path from "path";
import {CachedSettings, Settings} from "./models/settings";
const {app} = require('electron')
const isDev = require('electron-is-dev');

const DEFAULT_SETTINGS : Settings = {selectedImagesDirPath: undefined, selectedAnnotationFile: undefined}
const cachedSettings : CachedSettings = {
  ...DEFAULT_SETTINGS,
  update: function (updatedSettings) {
    this.selectedImagesDirPath = updatedSettings.selectedImagesDirPath;
    this.selectedAnnotationFile = updatedSettings.selectedAnnotationFile;
  }
};
export const getUserDataPath = (fileName: string) : string => isDev ? fileName : path.join(app.getPath('userData'), fileName)
const SETTINGS_FILE_PATH = getUserDataPath('_settings.json');

export const getSettings = async () : Promise<Settings> => {
  // if settings haven't been loaded from file
  if(!cachedSettings.selectedImagesDirPath) {
    try {
      const data = await fs.promises.readFile(SETTINGS_FILE_PATH, { encoding: "utf-8" });
      const storedSettings = JSON.parse(data) as Settings
      cachedSettings.update(storedSettings)
    } catch (e) {
      cachedSettings.update(DEFAULT_SETTINGS)
    }
  }

  return cachedSettings;
}

export const updateSettings = async (updatedSettings: Settings) : Promise<void> => {
  try {
    await fs.promises.writeFile(SETTINGS_FILE_PATH, JSON.stringify(updatedSettings));
    cachedSettings.update(updatedSettings)
  } catch (e) {
    throw e;
  }
}
