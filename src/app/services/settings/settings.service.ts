import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { Platforms, WorkingMode } from '../../../models/platforms';
import { ElectronService } from '../electron/electron.service';
import { FileAndDetectionSettings } from '../../../../electron/models/Settings';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly _platform: Platforms;
  private _workingMode: WorkingMode = WorkingMode.RemoteServer;
  private settings: Subject<FileAndDetectionSettings> =
    new Subject<FileAndDetectionSettings>();

  constructor(
    private platformService: Platform,
    private electronService: ElectronService
  ) {
    this._platform = this.getSystemPlatform();
    this.init();
  }

  private init() {
    switch (this.platform) {
      case Platforms.Electron:
        this.electronService.listenToSettingsUpdate(
          (settings: FileAndDetectionSettings) => {
            this.settings.next(settings);
          }
        );
        break;
      default:
        console.log(
          'Settings service initialization failed! Platform not supported!'
        );
    }
  }

  public getSettings(): Observable<FileAndDetectionSettings> {
    return this.settings.asObservable();
  }

  public get platform(): Platforms {
    return this._platform;
  }

  public get workingMode(): WorkingMode {
    return this._workingMode;
  }

  public set workingMode(newMode: WorkingMode) {
    this._workingMode = newMode;
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
