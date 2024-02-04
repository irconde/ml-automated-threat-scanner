import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventBusService {
  private wheelEventStartSource = new Subject<Event>();
  private wheelEventEndSource = new Subject<Event>();

  // Observable stream
  wheelEventStart$ = this.wheelEventStartSource.asObservable();
  wheelEventEnd$ = this.wheelEventEndSource.asObservable();

  // Emit event
  emitWheelEventStart(event: Event) {
    this.wheelEventStartSource.next(event);
  }

  emitWheelEventEnd(event: Event) {
    this.wheelEventEndSource.next(event);
  }
}
