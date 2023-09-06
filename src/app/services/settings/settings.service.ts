import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Platforms } from '../../../enums/platforms';
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
    private platformService: Platform, // private electronService: ElectronService,
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

  private async init() {
    const settings = await this.loadSettings(); // Load settings using Capacitor Preferences
    if (this.platform === Platforms.Electron) {
      this.electronService.sendSettingsUpdate(settings); // Send settings to Electron
    }
    this.settings.next(settings);
  }

  public getSettings(): Observable<ApplicationSettings | null> {
    return this.settings.asObservable();
  }

  public get platform(): Platforms {
    return this._platform;
  }

  public async update(
    newSettings: ApplicationSettings,
  ): Promise<ApplicationSettings> {
    await this.setSettings(newSettings); // Save settings using Capacitor Preferences
    if (this.platform === Platforms.Electron) {
      this.electronService.sendSettingsUpdate(newSettings); // Send settings to Electron
    }
    this.settings.next(newSettings); // Notify subscribers about the updated settings
    return newSettings;
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
