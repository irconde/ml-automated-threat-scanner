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
  constructor() {
    this.#settingsFilePath = CachedSettings.getUserDataPath("_settings.json")
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

  async get() : Promise<Settings> {
    // if settings haven't been loaded from file
    if(!this.#selectedImagesDirPath) {
      try {
        const data = await fs.promises.readFile(this.#settingsFilePath, { encoding: "utf-8" });
        const storedSettings = JSON.parse(data) as Settings
        this.#setPaths(storedSettings)
      } catch (e) {
        this.#setPaths(CachedSettings.DefaultSettings)
      }
    }

    return {selectedImagesDirPath: this.#selectedImagesDirPath, selectedAnnotationFile: this.#selectedAnnotationFile};
  }
}
