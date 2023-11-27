import { Component } from '@angular/core';
import { UiService } from '../../services/ui/ui.service';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import {
  DetectionsMap,
  DetectionsService,
} from '../../services/detections/detections.service';
import {
  DetectionClass,
  DetectionGroupMetaData,
} from '../../../models/detection';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [NgClass, NgForOf, MatIconModule, NgIf],
})
export class SideMenuComponent {
  public isOpen: boolean = false;
  public detectionsGroups: Record<string, DetectionClass[]> = {};
  public detectionsGroupMetaData: Record<string, DetectionGroupMetaData> = {};

  constructor(
    private uiService: UiService,
    private detectionsService: DetectionsService,
  ) {
    this.uiService.getIsSideMenuOpen().subscribe((isSideMenuOpen) => {
      this.isOpen = isSideMenuOpen;
    });

    this.detectionsService.getDetectionData().subscribe((detections) => {
      this.setDetectionsGroups(detections);
    });
    this.detectionsService
      .getDetectionsGroupsMetadata()
      .subscribe((detectionsMetaData) => {
        this.detectionsGroupMetaData = detectionsMetaData;
      });
  }

  public getAlgorithmNames(): string[] {
    return Object.keys(this.detectionsGroups);
  }

  public handleDetectionClick(detection: DetectionClass) {
    if (!detection.visible) return;
    const groupName = detection.groupName;
    if (
      detection.selected &&
      !this.detectionsGroupMetaData[groupName].selected
    ) {
      this.detectionsService.clearDetectionsSelection();
    } else {
      this.detectionsService.selectDetection(
        detection.uuid,
        detection.viewpoint,
      );
    }
  }

  private setDetectionsGroups(detections: DetectionsMap) {
    const allDetections = [...detections.side, ...detections.top];
    this.detectionsGroups = allDetections.reduce<
      Record<string, DetectionClass[]>
    >((map, currentDetection) => {
      const groupName = currentDetection.groupName;
      if (map[groupName]) {
        map[groupName].push(currentDetection);
      } else {
        map[groupName] = [currentDetection];
      }

      return map;
    }, {});
  }

  handleGroupChevronClick(event: MouseEvent, groupName: string) {
    event.stopPropagation();
    this.detectionsService.toggleDetectionGroupCollapse(groupName);
  }

  handleGroupEyeClick(event: MouseEvent, groupName: string) {
    event.stopPropagation();
    this.detectionsService.toggleDetectionGroupVisibility(groupName);
  }

  handleGroupNameClick(groupName: string) {
    if (this.detectionsGroupMetaData[groupName].visible) {
      this.detectionsService.toggleDetectionGroupSelection(groupName);
    }
  }

  handleDetectionEyeClick(event: MouseEvent, detection: DetectionClass) {
    event.stopPropagation();
    this.detectionsService.toggleDetectionVisibility(detection);
  }
}
