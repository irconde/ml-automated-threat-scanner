import { Injectable } from '@angular/core';
import { CurrentFileUpdatePayload } from '../../../../shared/models/channels-payloads';
import { Observable, Subject } from 'rxjs';
import { SettingsService } from '../settings/settings.service';
import { Platforms } from '../../../models/platforms';
import { ElectronService } from '../electron/electron.service';
import { FileParserService } from '../file-parser/file-parser.service';
import { FilePicker } from '@capawesome/capacitor-file-picker';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private configUpdatedSubject: Subject<CurrentFileUpdatePayload> =
    new Subject<CurrentFileUpdatePayload>();

  constructor(
    private settingsService: SettingsService,
    private electronService: ElectronService,
    private fileParserService: FileParserService
  ) {
    this.init();
  }

  /**
   * Used by all platforms to show a file picker for an individual .ORA file
   */
  async handleFileSelection() {
    try {
      const result = await FilePicker.pickFiles({ readData: true });
      const file = result.files[0];
      const fileName = file.name;
      const base_64_string = file.data;
      if (base_64_string) {
        const imageInfo = await this.fileParserService.loadData(base_64_string);
        console.log({ fileName });
        console.log(imageInfo);
      } else {
        console.log('File is empty');
      }
    } catch (e) {
      console.log(e);
    }
  }

  public getCurrentFile(): Observable<CurrentFileUpdatePayload> {
    return this.configUpdatedSubject.asObservable();
  }

  public setCurrentFile(payload: CurrentFileUpdatePayload): void {
    this.configUpdatedSubject.next(payload);
  }

  public requestNextFile(next: boolean) {
    switch (this.settingsService.platform) {
      case Platforms.Electron:
        this.electronService.requestNewFile(next);
        break;
      default:
        console.log(
          "'requestNextFile' in 'File service' is not implemented on current platform!"
        );
    }
  }

  private init() {
    switch (this.settingsService.platform) {
      case Platforms.Electron:
        this.electronService.listenToFileUpdate(
          (payload: CurrentFileUpdatePayload) => {
            this.configUpdatedSubject.next(payload);
          }
        );
        break;
      default:
        console.log('File service not implemented on current platform!');
    }
  }
}
