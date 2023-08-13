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
          }, 1750);
      }, 750);
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
                }, 1750);
            }, 750);
        }
    });

       return this.status.asObservable()
    };


}
