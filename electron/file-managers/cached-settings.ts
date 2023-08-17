import * as fs from "fs";
import * as path from "path";
import {FileAndAnnotationSettings} from "../models/Settings";
import {BrowserWindow} from "electron";
import {Channels} from "../../shared/constants/channels";
import {ChannelsManager} from "./channels-manager";

const {app} = require('electron')
const isDev = require('electron-is-dev');

export class CachedSettings extends ChannelsManager {
  static DefaultSettings : FileAndAnnotationSettings = {selectedImagesDirPath: undefined, selectedAnnotationFile: undefined}
  readonly #settingsFilePath : string;
  #selectedImagesDirPath: string | undefined;
  #selectedAnnotationFile: string | undefined;
  private constructor(browserWindow: BrowserWindow) {
    super(browserWindow);
    this.#settingsFilePath = CachedSettings.getUserDataPath("_settings.json")
  }

  static async create(browserWindow: BrowserWindow) : Promise<CachedSettings> {
    const settings: CachedSettings = new CachedSettings(browserWindow);
    await settings.#initFromFile();
    return settings;
  }

  #setPaths(settings: FileAndAnnotationSettings) {
    this.#selectedImagesDirPath = settings.selectedImagesDirPath;
    this.#selectedAnnotationFile = settings.selectedAnnotationFile;
  }

  static getUserDataPath(fileName: string) : string {
    return isDev ? fileName : path.join(app.getPath('userData'), fileName)
  }

  async update(updatedSettings: FileAndAnnotationSettings) : Promise<void> {
    try {
      await fs.promises.writeFile(this.#settingsFilePath, JSON.stringify(updatedSettings));
      this.#setPaths(updatedSettings);
      this.sendAngularUpdate(Channels.SettingsUpdate, this.get());
    } catch (e) {
      throw e;
    }
  }

  async #initFromFile() : Promise<void> {
    try {
      const data = await fs.promises.readFile(this.#settingsFilePath, { encoding: "utf-8" });
      const storedSettings = JSON.parse(data) as FileAndAnnotationSettings
      this.#setPaths(storedSettings)
    } catch (e) {
      this.#setPaths(CachedSettings.DefaultSettings)
    }
  }

  get() : FileAndAnnotationSettings {
    return {selectedImagesDirPath: this.#selectedImagesDirPath, selectedAnnotationFile: this.#selectedAnnotationFile};
  }
}
