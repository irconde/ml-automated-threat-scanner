import { Injectable } from '@angular/core';
import { getElectronAPI } from '../../get-electron-api';
import { Channels } from '../../../../shared/constants/channels';
import { FilePayload } from '../../../../shared/models/file-models';
import {
  AngularChannelPayloadMapper,
  ElectronChannelPayloadMapper,
} from '../../../../shared/models/channels-payloads';

@Injectable({
  providedIn: 'root',
})
export class ElectronService {
  private electronAPI = getElectronAPI();

  constructor() {}

  listenToFileUpdate(listener: (payload: FilePayload) => void) {
    this.electronAPI.on(Channels.CurrentFileUpdate, listener);
  }

  requestNewFile(
    payload: AngularChannelPayloadMapper[Channels.NewFileInvoke],
    callback: (payload: FilePayload | null) => void,
  ) {
    this.electronAPI.invoke(Channels.NewFileInvoke, payload, callback);
  }

  initFiles(
    sentPayload: { selectedImagesDirPath: string },
    callback: (electronPayload: FilePayload | null) => void,
  ) {
    this.electronAPI.invoke(Channels.InitFilesInvoke, sentPayload, callback);
  }

  saveCurrentFile(
    payload: AngularChannelPayloadMapper[Channels.SaveCurrentFileInvoke],
    callback: (
      electronPayload: ElectronChannelPayloadMapper[Channels.SaveCurrentFileInvoke],
    ) => void,
  ) {
    this.electronAPI.invoke(Channels.SaveCurrentFileInvoke, payload, callback);
  }
}
