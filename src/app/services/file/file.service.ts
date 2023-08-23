import { Injectable } from '@angular/core';
import { CurrentFileUpdatePayload } from '../../../../shared/models/channels-payloads';
import { Observable, Subject } from 'rxjs';
import { SettingsService } from '../settings/settings.service';
import { WorkingMode } from '../../../models/platforms';
import { ElectronService } from '../electron/electron.service';
import { FileParserService } from '../file-parser/file-parser.service';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private currentFileObservable: Subject<CurrentFileUpdatePayload> =
    new Subject<CurrentFileUpdatePayload>();

  constructor(
    private settingsService: SettingsService,
    private electronService: ElectronService,
    private fileParserService: FileParserService
  ) {
    this.init();
  }

  private init() {
    this.requestCurrentFile();
  }

  getCurrentFile(): Observable<CurrentFileUpdatePayload> {
    return this.currentFileObservable.asObservable();
  }

  requestNextFile(next: boolean) {
    switch (this.settingsService.workingMode) {
      case WorkingMode.LocalDirectory:
        this.electronService.requestNewFile(next);
        break;
      case WorkingMode.RemoteServer:
        // TODO: Get the next file from the server
        break;
      default:
        console.log(
          "'requestNextFile' in 'File service' is not implemented on current platform!"
        );
    }
  }

  requestCurrentFile() {
    switch (this.settingsService.workingMode) {
      case WorkingMode.LocalDirectory:
        this.electronService.listenToFileUpdate(
          (payload: CurrentFileUpdatePayload) => {
            this.currentFileObservable.next(payload);
          }
        );
        break;
      case WorkingMode.RemoteServer:
        // TODO: Get current file from server
        break;
      default:
        console.log(
          'You are not in a proper working mode of the application, please revisit your settings!'
        );
    }
  }
}
