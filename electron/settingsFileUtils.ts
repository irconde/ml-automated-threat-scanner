import * as fs from "fs";
import * as path from "path";
import {CachedSettings, Settings} from "./models/settings";
const {app} = require('electron')
const isDev = require('electron-is-dev');

let cachedSettings: CachedSettings = null;

export const [SETTINGS_FILE_PATH] = ['settings.json'].map((fileName) =>
  isDev ? fileName : path.join(app.getPath('userData'), fileName)
);

export const getSettings = async () : Promise<CachedSettings> => {
  try {
    if (cachedSettings) return cachedSettings
    else {
      const data = await fs.promises.readFile(SETTINGS_FILE_PATH, {encoding: "utf-8"});
      return JSON.parse(data) as Settings;
    }
  } catch (e) {
    throw e;
  }
}

export const updateSettings = async (updatedSettings: Settings) : Promise<void> => {
  try {
    await fs.promises.writeFile(SETTINGS_FILE_PATH, updatedSettings);
    cachedSettings = updatedSettings;
  } catch (e) {
    throw e;
  }
}
