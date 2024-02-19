import { Component } from '@angular/core';
import { UiService } from '../../services/ui/ui.service';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import {
  DetectionsMap,
  DetectionsService,
} from '../../services/detections/detections.service';
import {
  Detection,
  DetectionGroupMetaData,
  getDetectionGroupName,
} from '../../../models/detection';
import { MatIconModule } from '@angular/material/icon';
import { NextButtonComponent } from './next-button/next-button.component';
import { ImageStatus } from '../../services/ui/model/enum';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [NgClass, NgForOf, MatIconModule, NgIf, NextButtonComponent],
})
export class SideMenuComponent {
  public isOpen: boolean = false;
  public detectionsGroups: Record<string, Detection[]> = {};
  public detectionsGroupMetaData: Record<string, DetectionGroupMetaData> = {};
  protected isNextOrSaveBtn: boolean = true;
  protected isVisible: boolean = false;

  constructor(
    private uiService: UiService,
    private detectionsService: DetectionsService,
  ) {
    this.uiService.getIsSideMenuOpen().subscribe((isSideMenuOpen) => {
      this.isOpen = isSideMenuOpen;
    });

    this.uiService.getImageStatus().subscribe((status) => {
      this.isVisible = status !== ImageStatus.NoImage;
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

  public handleDetectionClick(detection: Detection) {
    if (!detection.visible) return;
    const groupName = getDetectionGroupName(detection);
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
    this.detectionsGroups = allDetections.reduce<Record<string, Detection[]>>(
      (map, currentDetection) => {
        const groupName = getDetectionGroupName(currentDetection);
        if (map[groupName]) {
          map[groupName].push(currentDetection);
        } else {
          map[groupName] = [currentDetection];
        }

        return map;
      },
      {},
    );
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

  handleDetectionEyeClick(event: MouseEvent, detection: Detection) {
    event.stopPropagation();
    this.detectionsService.toggleDetectionVisibility(detection);
  }
}
