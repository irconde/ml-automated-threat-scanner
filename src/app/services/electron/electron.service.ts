import { Injectable } from '@angular/core';
import {CurrentFileUpdatePayload} from "../../../../shared/models/channels-payloads";
import {getElectronAPI} from "../../get-electron-api";
import {Channels} from "../../../../shared/constants/channels";
import {Settings} from "../../../../electron/models/settings";

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private electronAPI = getElectronAPI();
  constructor() {

  }

  listenToFileUpdate(listener: (payload : CurrentFileUpdatePayload) => void) {
    this.electronAPI.on(Channels.CurrentFileUpdate, listener);
  }

  listenToSettingsUpdate(listener: (payload: Settings) => void)  {
    this.electronAPI.on(Channels.SettingsUpdate, listener);
  }

  requestNewFile(next: boolean) {
    this.electronAPI.send(Channels.NewFileRequest, next)
  }
}
