import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Platforms, WorkingMode } from '../../../enums/platforms';
import { BehaviorSubject, Observable } from 'rxjs';
import { ApplicationSettings, DEFAULT_SETTINGS } from './models/Settings';
import { Preferences } from '@capacitor/preferences';
import { ElectronService } from '../electron/electron.service';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly _platform: Platforms;
  private readonly _isMobile: boolean;
  private readonly STORAGE_KEY = 'SETTINGS_KEY';
  private settings: BehaviorSubject<ApplicationSettings | null> =
    new BehaviorSubject<ApplicationSettings | null>(null);

  constructor(
    private platformService: Platform,
    private electronService: ElectronService,
  ) {
    this._platform = this.getSystemPlatform();
    this._isMobile = [Platforms.iOS, Platforms.Android].includes(
      this._platform,
    );
    this.init().then();
  }

  public get isMobile(): boolean {
    return this._isMobile;
  }

  public get platform(): Platforms {
    return this._platform;
  }

  /**
   * Determine if the given settings are missing any required fields for the chosen file delivery method
   * @param settings
   */
  public static isMissingRequiredInfo(settings: ApplicationSettings): boolean {
    // returns true if application doesn't have basic settings for where to get the files from
    // TODO: decide if we actually have any required fields anymore
    return false;
  }

  public getSettings(): Observable<ApplicationSettings | null> {
    return this.settings.asObservable();
  }

  /**
   * Toggles 'wasLoggedInBefore' and 'workingMode' settings
   */
  public async toggleIsLoggedIn() {
    if (!this.settings.value) {
      throw new Error('Settings not initialized');
    }
    const { wasLoggedInBefore, ...otherSettings } = this.settings.value;
    // If user was logged in before, switch to individual file mode and remove wasLoggedInBefore.
    if (wasLoggedInBefore) {
      await this.update({
        ...otherSettings,
        workingMode: WorkingMode.IndividualFile,
      });
    } else {
      // If user wasn't logged in before, switch to MinIO mode and set wasLoggedInBefore.
      await this.update({
        ...otherSettings,
        wasLoggedInBefore: true,
        workingMode: WorkingMode.MinIO,
      });
    }
  }

  public async partialUpdate(partialSettings: Partial<ApplicationSettings>) {
    const currentSettings = this.settings.value;
    if (!currentSettings) {
      throw new Error('Settings not initialized');
    }
    await this.update({ ...currentSettings, ...partialSettings });
  }

  public async update(
    newSettings: ApplicationSettings,
  ): Promise<ApplicationSettings> {
    if (SettingsService.isMissingRequiredInfo(newSettings)) {
      throw Error('Missing required settings information');
    } else {
      await this.setSettings(newSettings); // Save settings using Capacitor Preferences
      this.settings.next(newSettings); // Notify subscribers about the updated settings
      return newSettings;
    }
  }

  private async init() {
    const settings = await this.loadSettings(); // Load settings using Capacitor Preferences
    this.settings.next(settings);
  }

  private setSettings = async (settings: ApplicationSettings) => {
    await Preferences.set({
      key: this.STORAGE_KEY,
      value: JSON.stringify(settings),
    });
  };

  private loadSettings = async (): Promise<ApplicationSettings> => {
    const { value } = await Preferences.get({ key: this.STORAGE_KEY });
    if (value !== null) {
      return JSON.parse(value) as ApplicationSettings;
    }
    await this.setSettings(DEFAULT_SETTINGS);
    return DEFAULT_SETTINGS;
  };

  private getSystemPlatform(): Platforms {
    if (this.platformService.is('electron')) {
      return Platforms.Electron;
    } else if (this.platformService.is('ios')) {
      return Platforms.iOS;
    } else if (this.platformService.is('android')) {
      return Platforms.Android;
    } else {
      return Platforms.Web;
    }
  }
}
