import {Injectable} from '@angular/core';
import {Platform} from "@ionic/angular";
import {Platforms} from "../../../models/platforms";


@Injectable({
  providedIn: 'root'
})
export class SettingsService {

  private readonly _platform: Platforms;
  constructor(private platformService: Platform) {
    this._platform = this.getIonicPlatform();
  }

  public get platform(): Platforms {
    return this._platform;
  }

  private getIonicPlatform() : Platforms {
    if(this.platformService.is('electron')) {
      return Platforms.Electron;
    } else if (this.platformService.is('ios')) {
      return Platforms.iOS;
    } else if(this.platformService.is('android')) {
      return Platforms.Android;
    } else {
      return Platforms.Web;
    }
  }
}
