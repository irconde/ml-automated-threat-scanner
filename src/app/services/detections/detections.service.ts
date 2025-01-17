import { Injectable } from '@angular/core';
import {
  BoundingBox,
  Detection,
  DetectionAlgorithm,
  DetectionGroupMetaData,
  DetectionGroups,
  getDetectionGroupName,
  Point,
} from '../../../models/detection';
import { BehaviorSubject, Observable } from 'rxjs';
import { CommonDetections } from '../../../enums/cornerstone';
import { v4 as guid } from 'uuid';
import {
  getViewportByViewpoint,
  updateCornerstoneViewports,
} from '../../utilities/cornerstone.utilities';
import { cornerstone } from '../../csSetup';
import { generateDetectionColor } from '../../utilities/detection.utilities';

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
  public labels: BehaviorSubject<string[]> = new BehaviorSubject<string[]>([]);
  private detectionsGroupsMetadata: BehaviorSubject<DetectionGroups> =
    new BehaviorSubject({});
  private selectedAlgorithm = new BehaviorSubject<DetectionAlgorithm | null>(
    null,
  );

  public get allDetections() {
    return [...this.detectionData.value.side, ...this.detectionData.value.top];
  }

  private algorithms: Record<string, DetectionAlgorithm> | null = null;

  constructor() {}

  public getSelectedAlgorithm() {
    return this.selectedAlgorithm.asObservable();
  }

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
          ...(prop === 'visible' && shouldUpdateDetections
            ? { selected: false }
            : {}),
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
        this.allDetections.forEach((det) => {
          const detectionGroupName = getDetectionGroupName(det);
          if (detectionGroupName === groupName) {
            det[prop] = propNewValue;
            if (prop === 'visible') det.selected = false;
          }
        });
        this.selectedDetection.next(null);
        if (prop === 'selected') {
          this.updateSelectedAlgorithm(groupName, propNewValue);
        } else {
          this.updateSelectedAlgorithm(groupName, false);
        }
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
    const detectionGroups = this.allDetections.reduce<DetectionGroups>(
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

  public setAlgorithms(algorithms: Record<string, DetectionAlgorithm>) {
    this.algorithms = algorithms;
  }

  selectDetection(detectionID: string, viewpoint: string): void {
    // TODO select by viewpoint

    const selectedDetection =
      this.allDetections.find(({ uuid }) => uuid === detectionID) || null;

    if (selectedDetection !== null) {
      selectedDetection.selected = true;
      this.allDetections.forEach((det) => {
        if (det.uuid !== selectedDetection?.uuid) {
          det.selected = false;
        }
      });
      this.clearGroupsSelection();
    }
    this.selectedDetection.next(selectedDetection);

    updateCornerstoneViewports();
  }

  public updateSelectedDetection(
    boundingBox: BoundingBox,
    polygonMask: Point[] | undefined,
  ) {
    if (this.selectedDetection.value === null) return;
    this.allDetections.some((det) => {
      const isFound = det.uuid === this.selectedDetection.value?.uuid;
      if (isFound) {
        det.boundingBox = boundingBox;
        if ('polygonMask' in det) {
          det.polygonMask = polygonMask;
        }
        this.selectedDetection.next(det);
      }
      return isFound;
    });
  }

  getSelectedDetection(): Observable<Detection | null> {
    return this.selectedDetection.asObservable();
  }

  getZoomLevel(selectedDetection: Detection) {
    const viewport = getViewportByViewpoint(selectedDetection.viewpoint);
    return cornerstone.getViewport(viewport)?.scale;
  }

  getLabels(): Observable<string[]> {
    const labels: string[] = this.allDetections
      .map((detection) => detection.className.toLowerCase())
      .filter((label, index, array) => array.indexOf(label) === index)
      .map((label) => label.toLowerCase())
      .filter((label) => label !== CommonDetections.Unknown.toLowerCase());

    this.labels.next(labels);

    return this.labels.asObservable();
  }

  setDetectionLabel(label: string) {
    if (!this.selectedDetection.value) return;
    const existingClassNameColor = this.allDetections.find(
      ({ className }) => className === label,
    )?.color;
    this.selectedDetection.value.color =
      existingClassNameColor ?? generateDetectionColor(label);
    this.selectedDetection.value.className = label;
    this.setDetectionData(this.detectionData.value);
  }

  setDetectionColor(color: string) {
    if (!this.selectedDetection.value) return;
    this.selectedDetection.value.color = color;
    const viewportNames = Object.keys(this.detectionData.value);
    viewportNames.forEach((viewportName) => {
      const detections =
        this.detectionData.value[viewportName as keyof DetectionsMap];
      detections.forEach((det) => {
        if (det.className === this.selectedDetection.value?.className) {
          det.color = color;
        }
      });
    });
    this.setDetectionData(this.detectionData.value);
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
      className: CommonDetections.Unknown,
      color: generateDetectionColor(CommonDetections.Unknown),
      uuid: guid(),
      // TODO: update below properties to the default
      confidence: 100,
      imageId: '',
      id: '',
      algorithm: '',
      categoryName: CommonDetections.Operator,
    };
    this.setDetectionData({
      ...this.detectionData.value,
      [viewpoint]: [...this.detectionData.value[viewpoint], newDetection],
    });

    this.selectDetection(newDetection.uuid, viewpoint);

    // upon detection creation, ensure the group name is visible
    const groupName = getDetectionGroupName(newDetection);
    if (!this.detectionsGroupsMetadata.value[groupName].visible) {
      this.toggleDetectionGroupProp(groupName, 'visible', false);
    }

    return newDetection;
  }

  clearDetectionsSelection(): void {
    this.selectedDetection.next(null);
    this.allDetections.forEach((det) => {
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
    for (const det of this.allDetections) {
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
    const groupVisible = this.allDetections.some((det) => {
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
    this.selectedAlgorithm.next(null);
  }

  private updateSelectedAlgorithm(groupName: string, selected: boolean) {
    let algorithm: DetectionAlgorithm | null = null;
    if (selected && this.algorithms && this.algorithms[groupName]) {
      algorithm = this.algorithms[groupName];
    }
    this.selectedAlgorithm.next(algorithm);
  }

  public deleteSelectedDetection() {
    if (this.selectedDetection.value === null) return;

    const currentValue = this.detectionData.value;
    const uuidToDelete = this.selectedDetection.value.uuid;

    const [updatedTopArray, updatedSideArray] = [
      currentValue.top,
      currentValue.side,
    ].map((detectionList) =>
      detectionList.filter(({ uuid }) => uuid !== uuidToDelete),
    );

    // Update the BehaviorSubject with the modified DetectionsMap
    this.detectionData.next({ top: updatedTopArray, side: updatedSideArray });

    this.selectedDetection.next(null);
  }
}
