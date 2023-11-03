import { Injectable } from '@angular/core';
import {
  BoundingBox,
  Detection,
  DetectionGroupMetaData,
  DetectionGroups,
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
  private selectedDetection: BehaviorSubject<Detection | null> =
    new BehaviorSubject<Detection | null>(null);
  private detectionsGroupsMetadata: BehaviorSubject<DetectionGroups> =
    new BehaviorSubject({});

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

  public toggleDetectionGroupVisibility(groupName: string) {
    this.toggleDetectionGroupProp(groupName, 'visible', true);
  }

  public toggleDetectionGroupCollapse(groupName: string) {
    this.toggleDetectionGroupProp(groupName, 'collapsed', false);
  }

  public toggleDetectionGroupSelection(groupName: string) {
    this.toggleDetectionGroupProp(groupName, 'selected', true);
  }

  /**
   * Give a group name and a prop to toggle ('selected' | 'collapsed' | 'visible') it updates the group metadata
   * prop and the detections associated with the group name
   * @param groupName - name of the group in which the prop should be updated
   * @param prop - a detection group metadata property to be updated
   * @param shouldUpdateDetections - whether detections within the group should be updated as well or just the group name
   * @param forcedValue - if provided, then rather than toggling the current state, we use this value
   */
  private toggleDetectionGroupProp(
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
      const updatedGroupMetaData: DetectionGroups = {
        ...this.detectionsGroupsMetadata.value,
        [groupName]: {
          ...groupMetaData,
          ...(prop === 'visible' ? { selected: false } : {}),
          [prop]: propNewValue,
        },
      };
      if (
        // update detections to match the state of the group name
        // used when the actual group name is clicked
        shouldUpdateDetections &&
        (prop === 'selected' || prop === 'visible')
      ) {
        if (prop === 'selected') this.clearDetectionsSelection();
        this.detections.forEach((det) => {
          const detectionGroupName = getDetectionGroupName(det);
          if (detectionGroupName === groupName) {
            det[prop] = propNewValue;
            if (prop === 'visible') det.selected = false;
          }
        });
        this.selectedDetection.next(null);
      }
      this.detectionsGroupsMetadata.next(updatedGroupMetaData);
      if (prop !== 'collapsed') updateCornerstoneViewports();
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
    const detectionGroups = this.detections.reduce<DetectionGroups>(
      (result, detection) => {
        const groupName = getDetectionGroupName(detection);
        if (!result[groupName]) {
          // get the current values for the groups
          const { collapsed, visible } = this.detectionsGroupsMetadata.value[
            groupName
          ] || { collapsed: false, visible: true };
          result[groupName] = {
            selected: false,
            visible,
            collapsed,
          };
        }
        return result;
      },
      {},
    );

    this.detectionsGroupsMetadata.next(detectionGroups);
  }

  selectDetection(detectionID: string, viewpoint: string): void {
    // TODO select by viewpoint

    const selectedDetection =
      this.detections.find(({ uuid }) => uuid === detectionID) || null;

    if (selectedDetection !== null) {
      selectedDetection.selected = true;
      this.detections.forEach((det) => {
        if (det.uuid !== selectedDetection?.uuid) {
          det.selected = false;
        }
      });
      this.clearGroupsSelection();
    }
    this.selectedDetection.next(selectedDetection);

    updateCornerstoneViewports();
  }

  getSelectedDetection(): Observable<Detection | null> {
    return this.selectedDetection.asObservable();
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

  clearDetectionsSelection(): void {
    this.selectedDetection.next(null);
    this.detections.forEach((det) => {
      det.selected = false;
    });

    this.clearGroupsSelection();

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
        if (det.uuid === this.selectedDetection.value?.uuid) {
          det.selected = false;
          this.selectedDetection.next(null);
        }
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

  private clearGroupsSelection() {
    for (const groupName in this.detectionsGroupsMetadata.value) {
      this.detectionsGroupsMetadata.value[groupName].selected = false;
    }
    this.detectionsGroupsMetadata.next(this.detectionsGroupsMetadata.value);
  }
}
