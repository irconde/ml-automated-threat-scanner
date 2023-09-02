import { Injectable } from '@angular/core';
import { getElectronAPI } from '../../get-electron-api';
import { Channels } from '../../../../shared/constants/channels';
import { FileAndDetectionSettings } from '../../../../electron/models/Settings';
import { FilePayload } from '../../../../shared/models/file-models';

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

  listenToSettingsUpdate(
    listener: (payload: FileAndDetectionSettings) => void,
  ) {
    this.electronAPI.on(Channels.SettingsUpdate, listener);
  }

  requestNewFile(next: boolean) {
    this.electronAPI.send(Channels.NewFileRequest, next);
  }
}
