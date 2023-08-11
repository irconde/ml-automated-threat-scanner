import { Injectable } from '@angular/core';
import { CurrentFileUpdatePayload } from "../../../../shared/modals/channels-payloads";
import { Observable, Subject } from "rxjs";
import { getElectronAPI } from "../../get-electron-api";


@Injectable({
  providedIn: 'root'
})
export class CurrentFileService {
  private configUpdatedSubject: Subject<CurrentFileUpdatePayload> = new Subject<CurrentFileUpdatePayload>();

  constructor() {
    getElectronAPI().listenToCurrentFileUpdate((payload : CurrentFileUpdatePayload)=> {
      console.log("Update from electron")
      console.log(payload)
      this.configUpdatedSubject.next(payload);
    })
  }

  getCurrentFile(): Observable<CurrentFileUpdatePayload> {
    return this.configUpdatedSubject.asObservable();
  }
}
