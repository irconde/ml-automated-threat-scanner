import { Injectable } from '@angular/core';
import { CurrentLocalDirectoryPayload } from '../../../../shared/models/file-models';
import { getElectronAPI } from '../../get-electron-api';
import { Channels } from '../../../../shared/constants/channels';
import { ApplicationSettings } from '../../../../electron/models/Settings';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private electronAPI = getElectronAPI();

  constructor() {
    //
  }

  listenToFileUpdate(
    listener: (payload: CurrentLocalDirectoryPayload) => void,
  ) {
    this.electronAPI.on(Channels.CurrentFileUpdate, listener);
  }

  listenToSettingsUpdate(listener: (payload: ApplicationSettings) => void) {
    this.electronAPI.on(Channels.SettingsUpdate, listener);
  }

  updateSettings(settings: ApplicationSettings) {
    this.electronAPI.send(Channels.SettingsUpdate, settings);
  }

  requestNewFile(next: boolean) {
    this.electronAPI.send(Channels.NewFileRequest, next);
  }
}
