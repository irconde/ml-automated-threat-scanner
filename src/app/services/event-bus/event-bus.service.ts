import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class EventBusService {
  private wheelEventStartSource = new Subject<Event>();
  private wheelEventEndSource = new Subject<Event>();
  private dragEventStartSource = new Subject<Event>();
  private dragEventEndSource = new Subject<Event>();

  // Observable stream
  wheelEventStart$ = this.wheelEventStartSource.asObservable();
  wheelEventEnd$ = this.wheelEventEndSource.asObservable();
  dragEventStart$ = this.dragEventStartSource.asObservable();
  dragEventEnd$ = this.dragEventEndSource.asObservable();

  // Emit events
  emitWheelEventStart(event: Event) {
    this.wheelEventStartSource.next(event);
  }

  emitWheelEventEnd(event: Event) {
    this.wheelEventEndSource.next(event);
  }

  emitDragEventStart(event: Event) {
    this.dragEventStartSource.next(event);
  }

  emitDragEventEnd(event: Event) {
    this.dragEventEndSource.next(event);
  }
}
