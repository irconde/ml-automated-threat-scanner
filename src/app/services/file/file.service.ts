import { Injectable } from '@angular/core';
import { CurrentFileUpdatePayload } from "../../../../shared/models/channels-payloads";
import { Observable, Subject } from "rxjs";
import { getElectronAPI } from "../../get-electron-api";
import {Channels} from "../../../../shared/constants/channels";
import {SettingsService} from "../settings/settings.service";
import {Platforms} from "../../../models/platforms";


@Injectable({
  providedIn: 'root'
})
export class FileService {
  private configUpdatedSubject: Subject<CurrentFileUpdatePayload> = new Subject<CurrentFileUpdatePayload>();

  constructor(private settingsService: SettingsService) {
    const platform = this.settingsService.getPlatform();
    switch (platform) {
      case Platforms.Electron:
        getElectronAPI().on(Channels.CurrentFileUpdate, (payload : CurrentFileUpdatePayload)=> {
          this.configUpdatedSubject.next(payload);
        })
        break;
      default:
        console.log("Settings service not implemented on current platform!");
    }

  }

  getCurrentFile(): Observable<CurrentFileUpdatePayload> {
    return this.configUpdatedSubject.asObservable();
  }
}
