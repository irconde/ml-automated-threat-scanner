import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Platforms } from '../../../enums/platforms';
import { ElectronService } from '../electron/electron.service';
import { Observable, Subject } from 'rxjs';
import { ApplicationSettings } from '../../../../electron/models/Settings';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly _platform: Platforms;
  private readonly _isMobile: boolean;
  private settings: Subject<ApplicationSettings> =
    new Subject<ApplicationSettings>();

  constructor(
    private platformService: Platform,
    private electronService: ElectronService,
  ) {
    this._platform = this.getSystemPlatform();
    this._isMobile = [Platforms.iOS, Platforms.Android].includes(
      this._platform,
    );
    this.init();
  }

  public get isMobile(): boolean {
    return this._isMobile;
  }

  private init() {
    switch (this.platform) {
      case Platforms.Electron:
        this.electronService.listenToSettingsUpdate(
          (settings: ApplicationSettings) => {
            this.settings.next(settings);
          },
        );
        break;
      default:
        console.log(
          'Settings service initialization failed! Platform not supported!',
        );
    }
  }

  public getSettings(): Observable<ApplicationSettings> {
    return this.settings.asObservable();
  }

  public get platform(): Platforms {
    return this._platform;
  }

  public async update(settings: ApplicationSettings): Promise<void> {
    switch (this.platform) {
      case Platforms.Electron:
        this.electronService.updateSettings(settings);
        break;
      default:
        console.log('Settings service update failed! Platform not supported!');
    }
  }

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
