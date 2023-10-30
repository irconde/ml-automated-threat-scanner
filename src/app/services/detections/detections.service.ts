import { Injectable } from '@angular/core';
import {
  BoundingBox,
  Detection,
  DetectionGroupMetaData,
  getDetectionGroupName,
  Point,
} from '../../../models/detection';
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
  private detectionsGroupsMetadata: BehaviorSubject<
    Record<string, DetectionGroupMetaData>
  > = new BehaviorSubject({});

  private get detections() {
    return [...this.detectionData.value.side, ...this.detectionData.value.top];
  }

  constructor() {}

  getDetectionData(): Observable<DetectionsMap> {
    return this.detectionData.asObservable();
  }

  public getDetectionsGroupsMetadata() {
    return this.detectionsGroupsMetadata.asObservable();
  }

  /**
   * Give a group name and a prop to toggle ('selected' | 'collapsed' | 'visible') it updates the group metadata
   * prop and the detections associated with the group name
   * @param groupName - name of the group in which the prop should be updated
   * @param prop - a detection group metadata property to be updated
   * @param shouldUpdateDetections - whether detections within the group should be updated as well or just the group name
   * @param forcedValue - if provided, then rather than toggling the current state, we use this value
   */
  public toggleDetectionGroupProp(
    groupName: string,
    prop: keyof DetectionGroupMetaData,
    shouldUpdateDetections: boolean,
    forcedValue: undefined | boolean = undefined,
  ) {
    if (!this.detectionsGroupsMetadata.value[groupName]) {
      throw Error(
        `Cannot toggle '${groupName}' group name in 'toggleDetectionGroupSelection'`,
      );
    } else {
      const groupMetaData = this.detectionsGroupsMetadata.value[groupName];
      const propNewValue = forcedValue ?? !groupMetaData[prop];
      const updatedGroupMetaData: Record<string, DetectionGroupMetaData> = {
        ...this.detectionsGroupsMetadata.value,
        [groupName]: {
          ...groupMetaData,
          [prop]: propNewValue,
        },
      };
      if (
        // update detections to match the state of the group name
        // used when the actual group name is clicked
        shouldUpdateDetections &&
        (prop === 'selected' || prop === 'visible')
      ) {
        this.detections.forEach((det) => {
          const detectionGroupName = getDetectionGroupName(det);
          if (detectionGroupName === groupName) {
            det[prop] = propNewValue;
          }
        });
      }
      this.detectionsGroupsMetadata.next(updatedGroupMetaData);
      updateCornerstoneViewports();
    }
  }

  setDetectionData(detectionData: Partial<DetectionsMap>) {
    const detectionsMap: DetectionsMap = {
      ...this.detectionData.value,
      ...detectionData,
    };
    this.detectionData.next(detectionsMap);
    this.setDetectionsGroupsMetadata();
  }

  private setDetectionsGroupsMetadata() {
    const detectionGroups = this.detections.reduce<
      Record<string, DetectionGroupMetaData>
    >((result, detection) => {
      const groupName = getDetectionGroupName(detection);
      if (!result[groupName]) {
        result[groupName] = {
          selected: false,
          visible: true,
          collapsed: false,
        };
      }
      return result;
    }, {});

    this.detectionsGroupsMetadata.next(detectionGroups);
  }

  selectDetection(detectionID: string, viewpoint: string): void {
    // TODO select by viewpoint
    console.log(viewpoint);

    this.selectedDetection =
      this.detections.find(({ uuid }) => uuid === detectionID) || null;

    if (this.selectedDetection !== null) {
      this.selectedDetection.selected = true;
      this.detections.forEach((det) => {
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
      algorithm: 'NEW',
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
    this.detections.forEach((det) => {
      det.selected = false;
    });

    updateCornerstoneViewports();
  }

  /**
   * Toggles the visibility of a single detection
   * @param detection
   */
  toggleDetectionVisibility(detection: Detection) {
    let detectionGroupName = '';

    // Loop through detections to find the given detection by id and update its visibility
    for (const det of this.detections) {
      if (det.uuid === detection.uuid) {
        det.visible = !det.visible;
        detectionGroupName = getDetectionGroupName(det); // Get the group name
        break; // Stop the loop once the desired detection is found
      }
    }

    // Determine the group visibility based on the updated detection
    const groupVisible = this.detections.some((det) => {
      const groupName = getDetectionGroupName(det);
      return groupName === detectionGroupName && det.visible;
    });

    this.toggleDetectionGroupProp(
      detectionGroupName,
      'visible',
      false,
      groupVisible,
    );
    updateCornerstoneViewports();
  }
}
