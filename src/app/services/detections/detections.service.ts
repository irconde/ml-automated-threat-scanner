import { Injectable } from '@angular/core';
import { BoundingBox, Detection } from '../../../models/detection';
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
  private selectedDetection: Detection | null = null;

  constructor() {}

  getDetectionData(): Observable<DetectionsMap> {
    return this.detectionData.asObservable();
  }

  setDetectionData(detectionData: Partial<DetectionsMap>) {
    this.detectionData.next({ ...this.detectionData.value, ...detectionData });
  }

  selectDetection(detectionID: string, viewpoint: string): void {
    // TODO select by viewpoint
    console.log(viewpoint);
    const allDetections = [
      ...this.detectionData.value.top,
      ...this.detectionData.value.side,
    ];

    this.selectedDetection =
      allDetections.find((detection) => detection.uuid === detectionID) || null;

    if (this.selectedDetection !== null) {
      this.selectedDetection.selected = true;
      this.detectionData.value.top.forEach((det) => {
        if (det.uuid !== this.selectedDetection?.uuid) {
          det.selected = false;
        }
      });

      this.detectionData.value.side.forEach((det) => {
        if (det.uuid !== this.selectedDetection?.uuid) {
          det.selected = false;
        }
      });
    }
  }

  getSelectedDetection(): Detection | null {
    return this.selectedDetection;
  }

  addDetection(
    bbox: BoundingBox,
    area: number,
    viewportName: keyof DetectionsMap,
  ): Detection {
    const newDetection: Detection = {
      selected: false,
      categorySelected: false,
      viewpoint: viewportName,
      visible: true,
      boundingBox: bbox,
      iscrowd: 0,
      color: 'orange',
      detectionFromFile: false,
      confidence: 0,
      imageId: '',
      id: '',
      algorithm: '',
      className: '',
      categoryName: '',
      uuid: '',
      polygonMask: [],
    };
    this.setDetectionData({
      ...this.detectionData.value,
      [viewportName]: [...this.detectionData.value[viewportName], newDetection],
    });

    return newDetection;
  }

  clearSelectedDetection(): void {
    this.selectedDetection = null;
    this.detectionData.value.top.forEach((det) => {
      det.selected = false;
    });

    this.detectionData.value.side.forEach((det) => {
      det.selected = false;
    });
  }
}
