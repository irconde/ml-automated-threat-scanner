import {Injectable} from '@angular/core';
import {CurrentFileUpdatePayload} from "../../../../shared/models/channels-payloads";
import {Observable, Subject} from "rxjs";
import {SettingsService} from "../settings/settings.service";
import {Platforms} from "../../../models/platforms";
import {ElectronService} from "../electron/electron.service";


@Injectable({
  providedIn: 'root'
})
export class FileService {
  private configUpdatedSubject: Subject<CurrentFileUpdatePayload> = new Subject<CurrentFileUpdatePayload>();

  constructor(private settingsService: SettingsService, private electronService: ElectronService) {
    switch (this.settingsService.platform) {
      case Platforms.Electron:
        this.electronService.listenToFileUpdate((payload : CurrentFileUpdatePayload)=> {
          this.configUpdatedSubject.next(payload);
        })
        break;
      default:
        console.log("File service not implemented on current platform!");
    }

  }

  getCurrentFile(): Observable<CurrentFileUpdatePayload> {
    return this.configUpdatedSubject.asObservable();
  }

  requestNextFile(next: boolean) {
    switch (this.settingsService.platform) {
      case Platforms.Electron:
        this.electronService.requestNewFile(next)
        break;
      default:
        console.log("'requestNextFile' in 'File service' is not implemented on current platform!");
    }
  }
}
