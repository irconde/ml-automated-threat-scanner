import { BrowserWindow } from 'electron';
import { Channels } from '../../shared/constants/channels';
import { ChannelsManager } from './channels-manager';
import { ApplicationSettings } from '../../src/app/services/settings/models/Settings';

const { app } = require('electron');
const isDev = require('electron-is-dev');

/**
 * This class is responsible for caching the settings in the main process by listening to the Angular event
 * An update handler is provided to handle the settings update
 */
export class CachedSettings extends ChannelsManager {
  #settings: ApplicationSettings | null = null;

  constructor(
    browserWindow: BrowserWindow,
    updateHandler: (settings: ApplicationSettings | null) => Promise<void>,
  ) {
    super(browserWindow);
    this.onAngularEvent(Channels.SettingsUpdate, async (e, settings) => {
      this.#settings = settings;
      await updateHandler(settings);
    });
  }

  public get(): ApplicationSettings | null {
    return this.#settings;
  }
}
