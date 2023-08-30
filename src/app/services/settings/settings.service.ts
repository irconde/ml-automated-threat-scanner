import { Injectable } from '@angular/core';
import { Platform } from '@ionic/angular';
import { FileFormat, Platforms, WorkingMode } from '../../../enums/platforms';
import { ElectronService } from '../electron/electron.service';
import { FileAndDetectionSettings } from '../../../../electron/models/Settings';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class SettingsService {
  private readonly _platform: Platforms;
  private readonly _isMobile: boolean;
  private _workingMode: WorkingMode = WorkingMode.RemoteServer;
  private _fileFormat: FileFormat = FileFormat.OpenRaster;
  private _remoteIp = '127.0.0.1';
  private _remotePort = '4001';
  private settings: Subject<FileAndDetectionSettings> =
    new Subject<FileAndDetectionSettings>();

  constructor(
    private platformService: Platform,
    private electronService: ElectronService
  ) {
    this._platform = this.getSystemPlatform();
    this._isMobile = [Platforms.iOS, Platforms.Android].includes(
      this._platform
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

  public get fileFormat(): FileFormat {
    return this._fileFormat;
  }

  public set fileFormat(newFormat: FileFormat) {
    this._fileFormat = newFormat;
  }

  public get remoteIp(): string {
    return this._remoteIp;
  }

  public set remoteIp(newIp: string) {
    this._remoteIp = newIp;
  }

  public get remotePort(): string {
    return this._remotePort;
  }

  public set remotePort(newPort: string) {
    this._remotePort = newPort;
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
