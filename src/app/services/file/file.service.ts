import { Injectable } from '@angular/core';
import { FilePayload, FileStatus } from '../../../../shared/models/file-models';
import { API } from '../../../enums/remote-service';
import { Observable, Subject } from 'rxjs';
import { SettingsService } from '../settings/settings.service';
import { Platforms, WorkingMode } from '../../../enums/platforms';
import { ElectronService } from '../electron/electron.service';
import { FileParserService } from '../file-parser/file-parser.service';
import { FilePicker } from '@capawesome/capacitor-file-picker';
import { HttpClient } from '@angular/common/http';
import { ApplicationSettings } from '../settings/models/Settings';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  private currentFileObservable: Subject<FilePayload | null> =
    new Subject<FilePayload | null>();
  private settings: ApplicationSettings | null = null;

  constructor(
    private settingsService: SettingsService,
    private electronService: ElectronService,
    private fileParserService: FileParserService,
    private httpClient: HttpClient,
  ) {
    this.settingsService
      .getSettings()
      .subscribe((newSettings) => this.handleSettingsChange(newSettings));
  }

  /**
   * Used by all platforms to show a file picker for an individual .ORA file
   */
  public async handleFileSelection() {
    try {
      const result = await FilePicker.pickFiles({ readData: true });
      this.settings!.workingMode = WorkingMode.IndividualFile;
      const file = result.files[0];
      const fileName = file.name;
      const base_64_string = file.data;
      if (base_64_string) {
        this.setCurrentFile({
          status: FileStatus.Ok,
          fileName,
          filesCount: 1,
          file: base_64_string,
        });
      } else {
        console.log('File is empty');
      }
    } catch (e) {
      console.log(e);
    }
  }

  public setCurrentFile(payload: FilePayload | null): void {
    this.currentFileObservable.next(payload);
  }

  public getCurrentFile(): Observable<FilePayload | null> {
    return this.currentFileObservable.asObservable();
  }

  public requestNextFile(next: boolean) {
    switch (this.settings?.workingMode) {
      case WorkingMode.LocalDirectory:
        if (!this.settings.selectedImagesDirPath) return;
        this.electronService.requestNewFile(
          {
            isNext: next,
            selectedImagesDirPath: this.settings.selectedImagesDirPath,
          },
          (filePayload: FilePayload | null) => {
            // if no more files, don't update the current file
            if (filePayload !== null) this.setCurrentFile(filePayload);
          },
        );
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
          "'requestNextFile' in 'File service' is not implemented on current platform!",
        );
    }
  }

  private handleSettingsChange(newSettings: ApplicationSettings | null) {
    switch (newSettings?.workingMode) {
      case WorkingMode.LocalDirectory:
        this.requestNewImageDirFromElectron(newSettings);
        break;
      case WorkingMode.RemoteServer:
        this.requestCurrentFileFromServer(newSettings);
        break;
      default:
        break;
    }

    // update the settings
    this.settings = newSettings;
  }

  /**
   * If the selectedImagesDirPath changes in the new settings, a request is sent to electron
   * to update the files and send the new current file
   * @param newSettings - the new settings payload received from the modal
   */
  private requestNewImageDirFromElectron(
    newSettings: ApplicationSettings,
  ): void {
    const skipUpdate =
      this.shouldSkipUpdate(
        newSettings,
        'selectedImagesDirPath',
        'workingMode',
      ) || this.settingsService.platform !== Platforms.Electron;

    if (!skipUpdate && newSettings?.selectedImagesDirPath) {
      this.electronService.initFiles(
        { selectedImagesDirPath: newSettings.selectedImagesDirPath },
        (filePayload) => {
          this.setCurrentFile(filePayload);
        },
      );
    }
  }

  /**
   * Checks whether an update should be skipped based on the provided settings and keys.
   * @param newSettings - new settings passed from the settings modal
   * @param keys - the properties of the settings to track
   * @private
   */
  private shouldSkipUpdate(
    newSettings: ApplicationSettings,
    ...keys: (keyof ApplicationSettings)[]
  ): boolean {
    return keys.every(
      (key: keyof ApplicationSettings) =>
        this.settings && newSettings[key] === this.settings[key],
    );
  }

  private requestCurrentFileFromServer(newSettings: ApplicationSettings): void {
    // only send a request to the server if one of the attributes have changed
    const skipUpdate = this.shouldSkipUpdate(
      newSettings,
      'remoteIp',
      'remotePort',
      'fileFormat',
      'workingMode',
    );
    if (skipUpdate) return;
    else {
      const { remoteIp, remotePort, fileFormat } = newSettings;
      this.httpClient
        .post<FilePayload>(
          `${API.protocol}${remoteIp}:${remotePort}${API.getCurrentFile}`,
          {
            fileFormat,
          },
        )
        .subscribe({
          next: (filePayload) => this.setCurrentFile(filePayload),
          error: (error) =>
            console.log(`Error connection with server: ${error.message}`),
        });
    }
  }
}
