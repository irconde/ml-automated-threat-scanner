import * as fs from "fs";
import * as path from "path";
import {Settings} from "../models/settings";
const {app} = require('electron')
const isDev = require('electron-is-dev');

export class CachedSettings {
  static DefaultSettings : Settings = {selectedImagesDirPath: undefined, selectedAnnotationFile: undefined}
  readonly #settingsFilePath : string;
  #selectedImagesDirPath: string | undefined;
  #selectedAnnotationFile: string | undefined;
  private constructor() {
    this.#settingsFilePath = CachedSettings.getUserDataPath("_settings.json")
  }

  static async create() : Promise<CachedSettings> {
    const settings: CachedSettings = new CachedSettings()
    await settings.#initFromFile();
    return settings;
  }

  #setPaths(settings: Settings) {
    this.#selectedImagesDirPath = settings.selectedImagesDirPath;
    this.#selectedAnnotationFile = settings.selectedAnnotationFile;
  }

  static getUserDataPath(fileName: string) : string {
    return isDev ? fileName : path.join(app.getPath('userData'), fileName)
  }

  async update(updatedSettings: Settings) : Promise<void> {
    try {
      await fs.promises.writeFile(this.#settingsFilePath, JSON.stringify(updatedSettings));
      this.#setPaths(updatedSettings);
    } catch (e) {
      throw e;
    }
  }

  async #initFromFile() : Promise<void> {
    try {
      const data = await fs.promises.readFile(this.#settingsFilePath, { encoding: "utf-8" });
      const storedSettings = JSON.parse(data) as Settings
      this.#setPaths(storedSettings)
    } catch (e) {
      this.#setPaths(CachedSettings.DefaultSettings)
    }
  }

  get() : Settings {
    return {selectedImagesDirPath: this.#selectedImagesDirPath, selectedAnnotationFile: this.#selectedAnnotationFile};
  }
}
