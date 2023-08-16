import { Injectable } from '@angular/core';
import { CurrentFileUpdatePayload } from "../../../../shared/modals/channels-payloads";
import { Observable, Subject } from "rxjs";
import { getElectronAPI } from "../../get-electron-api";
import {Channels} from "../../../../shared/constants/channels";


@Injectable({
  providedIn: 'root'
})
export class FileService {
  private configUpdatedSubject: Subject<CurrentFileUpdatePayload> = new Subject<CurrentFileUpdatePayload>();

  constructor() {
    getElectronAPI().on(Channels.CurrentFileUpdate, (payload : CurrentFileUpdatePayload)=> {
      this.configUpdatedSubject.next(payload);
    })
  }

  getCurrentFile(): Observable<CurrentFileUpdatePayload> {
    return this.configUpdatedSubject.asObservable();
  }
}
