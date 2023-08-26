import { Injectable } from '@angular/core';
import {
  CurrentLocalDirectoryPayload,
  CurrentRemoteServerPayload,
  FilePayload,
} from '../../../../shared/models/file-models';
import { API } from '../../../enums/remote-service';
import { Observable, Subject } from 'rxjs';
import { SettingsService } from '../settings/settings.service';
import { Platforms, WorkingMode } from '../../../enums/platforms';
import { ElectronService } from '../electron/electron.service';
import { FileParserService } from '../file-parser/file-parser.service';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private currentFileObservable: Subject<FilePayload> =
    new Subject<FilePayload>();

  constructor(
    private settingsService: SettingsService,
    private electronService: ElectronService,
    private fileParserService: FileParserService,
    private httpClient: HttpClient
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

  public setCurrentFile(payload: FilePayload): void {
    this.currentFileObservable.next(payload);
  }

  getCurrentFile(): Observable<CurrentLocalDirectoryPayload> {
    return this.currentFileObservable.asObservable();
  }

  requestNextFile(next: boolean) {
    switch (this.settingsService.workingMode) {
      case WorkingMode.LocalDirectory:
        this.electronService.requestNewFile(next);
        break;
      case WorkingMode.RemoteServer:
        switch (this.settingsService.platform) {
          case Platforms.Android:
          case Platforms.iOS:
            // TODO: Http Phonegap plugin
            break;
          case Platforms.Electron:
          case Platforms.Web:
            // TODO: Normal HTTP request
            break;
          default:
          //
        }
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
          (payload: CurrentLocalDirectoryPayload) => {
            this.currentFileObservable.next(payload);
          }
        );
        break;
      case WorkingMode.RemoteServer:
        this.httpClient
          .post<CurrentRemoteServerPayload>(
            `${API.protocol}${this.settingsService.remoteIp}:${this.settingsService.remotePort}${API.getCurrentFile}`,
            {
              fileFormat: this.settingsService.fileFormat,
            }
          )
          .subscribe((result: CurrentRemoteServerPayload) => {
            this.currentFileObservable.next(result);
          });
        break;
      default:
        console.log(
          'You are not in a proper working mode of the application, please revisit your settings!'
        );
    }
  }

  private init() {
    this.requestCurrentFile();
  }
}
