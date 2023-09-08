import { Injectable } from '@angular/core';
import { getElectronAPI } from '../../get-electron-api';
import { Channels } from '../../../../shared/constants/channels';
import { FilePayload } from '../../../../shared/models/file-models';
import { ApplicationSettings } from '../settings/models/Settings';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private electronAPI = getElectronAPI();

  constructor() {}

  listenToFileUpdate(listener: (payload: FilePayload) => void) {
    this.electronAPI.on(Channels.CurrentFileUpdate, listener);
  }

  requestNewFile(next: boolean) {
    this.electronAPI.send(Channels.NewFileRequest, next);
  }

  sendSettingsUpdate(settings: ApplicationSettings) {
    this.electronAPI.send(Channels.SettingsUpdate, settings);
  }

  initFiles(
    sentPayload: { selectedImagesDirPath: string },
    callback: (electronPayload: FilePayload | null) => void,
  ) {
    this.electronAPI.invoke(Channels.InitFilesRequest, sentPayload, callback);
  }
}
