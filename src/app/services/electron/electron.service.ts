import { Injectable } from '@angular/core';
import {CurrentFileUpdatePayload} from "../../../../shared/models/channels-payloads";
import {getElectronAPI} from "../../get-electron-api";
import {Channels} from "../../../../shared/constants/channels";

@Injectable({
  providedIn: 'root'
})
export class ElectronService {

  constructor() { }

  listenToFileUpdate(listener: (payload : CurrentFileUpdatePayload) => void) {
    getElectronAPI().on(Channels.CurrentFileUpdate, listener);
  }

  requestNewFile(next: boolean) {
    getElectronAPI().send(Channels.RequestNewFile, next)
  }
}
