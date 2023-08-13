import { Injectable } from '@angular/core';
import {connect} from 'socket.io-client';
import {Observable, Subject} from "rxjs";

export enum SocketStatus {
  CONNECTED = "CONNECTED",
  DISCONNECTED = "DISCONNECTED",
  CONNECTING = "CONNECTING",
  IDLE = "IDLE"
}

@Injectable({
  providedIn: 'root'
})

export class SocketService {

  status : Subject<SocketStatus> = new Subject<SocketStatus>();
  private static readonly SOCKET_URL = 'http://localhost:4001';
  private static readonly CONNECTION_DURATION = 750;
  private static readonly RESET_DELAY = 1750;

  constructor() {
    this.status.next(SocketStatus.IDLE);
  }

   testConnection() : Observable<SocketStatus> {
     const socket = connect(SocketService.SOCKET_URL);
     socket.on('connect', () => {
         this.status.next(SocketStatus.CONNECTING)
       setTimeout(() => {
          this.status.next(SocketStatus.CONNECTED)
          setTimeout(() => {
              this.status.next(SocketStatus.IDLE)
          }, SocketService.RESET_DELAY);
      }, SocketService.CONNECTION_DURATION);
     })

    socket.on('connect_error', (err) => {
        this.status.next(SocketStatus.CONNECTING);
        console.log(`connect_error due to ${err.message}`);
        if (
            err.message === 'xhr poll error' ||
            err.message === 'server error'
        ) {
            socket.disconnect();
            setTimeout(() => {
                this.status.next(SocketStatus.DISCONNECTED)
                setTimeout(() => {
                  this.status.next(SocketStatus.IDLE);
                }, SocketService.RESET_DELAY);
            }, SocketService.CONNECTION_DURATION);
        }
    });

       return this.status.asObservable()
    };


}
