import { Component } from '@angular/core';
import { UiService } from '../../services/ui/ui.service';
import { NgClass, NgForOf, NgIf } from '@angular/common';
import {
  DetectionsMap,
  DetectionsService,
} from '../../services/detections/detections.service';
import { Detection, DetectionGroupMetaData } from '../../../models/detection';
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
  public detectionsGroups: Record<string, Detection[]> = {};
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

  public handleDetectionClick(detection: Detection) {
    if (detection.selected) {
      this.detectionsService.clearSelectedDetection();
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
        const groupKey =
          currentDetection.algorithm || currentDetection.categoryName;
        if (map[groupKey]) {
          map[groupKey].push(currentDetection);
        } else {
          map[groupKey] = [currentDetection];
        }

        return map;
      },
      {},
    );

    console.log(this.detectionsGroups);
  }

  handleGroupChevronClick(event: MouseEvent, groupName: string) {
    event.stopPropagation();
    this.detectionsService.toggleDetectionGroupProp(groupName, 'collapsed');
  }

  handleGroupEyeClick(event: MouseEvent, groupName: string) {
    event.stopPropagation();
    this.detectionsService.toggleDetectionGroupProp(groupName, 'visible');
  }

  handleGroupNameClick(groupName: string) {
    console.log('group name click');
    this.detectionsService.toggleDetectionGroupProp(groupName, 'selected');
  }
}
