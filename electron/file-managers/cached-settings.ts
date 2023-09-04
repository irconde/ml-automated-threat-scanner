import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { Channels } from '../../shared/constants/channels';
import { ChannelsManager } from './channels-manager';
import { ApplicationSettings, DEFAULT_SETTINGS } from '../models/Settings';

const { app } = require('electron');
const isDev = require('electron-is-dev');

export class CachedSettings extends ChannelsManager {
  readonly #settingsFilePath: string;
  #settings: ApplicationSettings = DEFAULT_SETTINGS;

  private constructor(browserWindow: BrowserWindow) {
    super(browserWindow);
    this.#settingsFilePath = CachedSettings.getUserDataPath('_settings.json');
    this.onAngularRequest(Channels.SettingsUpdate, async (e, settings) => {
      await this.update(settings);
    });
  }

  static async create(browserWindow: BrowserWindow): Promise<CachedSettings> {
    const settings: CachedSettings = new CachedSettings(browserWindow);
    await settings.#initFromFile();
    return settings;
  }

  #updateCachedSettings(settings: ApplicationSettings) {
    this.#settings.fileFormat = settings.fileFormat;
    this.#settings.remoteIp = settings.remoteIp;
    this.#settings.remotePort = settings.remotePort;
    this.#settings.workingMode = settings.workingMode;
    this.#settings.selectedImagesDirPath = settings.selectedImagesDirPath;
    this.#settings.autoConnect = settings.autoConnect;
    this.#settings.fileNameSuffix = settings.fileNameSuffix;
    this.#settings.detectionFormat = settings.detectionFormat;
  }

  static getUserDataPath(fileName: string): string {
    return isDev ? fileName : path.join(app.getPath('userData'), fileName);
  }

  async update(updatedSettings: ApplicationSettings): Promise<void> {
    await fs.promises.writeFile(
      this.#settingsFilePath,
      JSON.stringify(updatedSettings),
    );
    this.#updateCachedSettings(updatedSettings);
    this.sendAngularUpdate(Channels.SettingsUpdate, this.get());
  }

  async #initFromFile(): Promise<void> {
    try {
      const data = await fs.promises.readFile(this.#settingsFilePath, {
        encoding: 'utf-8',
      });
      const storedSettings = JSON.parse(data) as ApplicationSettings;
      this.#updateCachedSettings(storedSettings);
    } catch (e) {
      this.#updateCachedSettings(DEFAULT_SETTINGS);
    }
  }

  get(): ApplicationSettings {
    return this.#settings;
  }
}
