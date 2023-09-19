import { Injectable } from '@angular/core';
import { Detection } from '../../../models/detection';
import { BehaviorSubject, Observable } from 'rxjs';

interface DetectionsMap {
  top: Detection[];
  side: Detection[];
}

@Injectable({
  providedIn: 'root',
})
export class DetectionsService {
  private detectionData: BehaviorSubject<DetectionsMap> =
    new BehaviorSubject<DetectionsMap>({ top: [], side: [] });

  constructor() {}

  getDetectionData(): Observable<DetectionsMap> {
    return this.detectionData.asObservable();
  }

  setDetectionData(detectionData: Partial<DetectionsMap>) {
    this.detectionData.next({ ...this.detectionData.value, ...detectionData });
  }
}
