import { Injectable } from '@angular/core';
import { getElectronAPI } from '../../get-electron-api';
import { Channels } from '../../../../shared/constants/channels';
import { FilePayload } from '../../../../shared/models/file-models';
import { ApplicationSettings } from '../../../../electron/models/Settings';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private electronAPI = getElectronAPI();

  constructor() {
    //
  }

  listenToFileUpdate(listener: (payload: FilePayload) => void) {
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
