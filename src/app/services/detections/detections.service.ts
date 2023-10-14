import { Injectable } from '@angular/core';
import { BoundingBox, Detection, Point } from '../../../models/detection';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonDetections } from '../../../enums/cornerstone';
import { v4 as guid } from 'uuid';
import { updateCornerstoneViewports } from '../../utilities/cornerstone.utilities';

export interface DetectionsMap {
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

    updateCornerstoneViewports();
  }

  getSelectedDetection(): Detection | null {
    return this.selectedDetection;
  }

  addDetection(
    viewpoint: keyof DetectionsMap,
    boundingBox: BoundingBox,
    polygonMask: Point[] | undefined,
  ): Detection {
    const newDetection: Detection = {
      viewpoint,
      polygonMask,
      boundingBox,
      selected: false,
      categorySelected: false,
      visible: true,
      iscrowd: 0,
      detectionFromFile: false,
      className: CommonDetections.Operator,
      color: 'orange',
      uuid: guid(),
      // TODO: update below properties to the default
      confidence: 0,
      imageId: '',
      id: '',
      algorithm: '',
      categoryName: '',
    };
    this.setDetectionData({
      ...this.detectionData.value,
      [viewpoint]: [...this.detectionData.value[viewpoint], newDetection],
    });

    this.selectDetection(newDetection.uuid, viewpoint);

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

    updateCornerstoneViewports();
  }
}
