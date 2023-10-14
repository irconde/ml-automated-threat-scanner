import { Component } from '@angular/core';
import { UiService } from '../../services/ui/ui.service';
import { NgClass, NgForOf } from '@angular/common';
import {
  DetectionsMap,
  DetectionsService,
} from '../../services/detections/detections.service';
import { Detection } from '../../../models/detection';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-side-menu',
  templateUrl: './side-menu.component.html',
  styleUrls: ['./side-menu.component.scss'],
  standalone: true,
  imports: [NgClass, NgForOf, MatIconModule],
})
export class SideMenuComponent {
  public isOpen: boolean = false;
  public algorithmsMap: Record<string, Detection[]> = {};

  constructor(
    private uiService: UiService,
    private detectionsService: DetectionsService,
  ) {
    this.uiService.getIsSideMenuOpen().subscribe((isSideMenuOpen) => {
      this.isOpen = isSideMenuOpen;
    });

    this.detectionsService.getDetectionData().subscribe((detections) => {
      this.updateAlgorithmsMap(detections);
    });
  }

  public getAlgorithmNames(): string[] {
    return Object.keys(this.algorithmsMap);
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

  private updateAlgorithmsMap(detections: DetectionsMap) {
    const allDetections = [...detections.side, ...detections.top];
    this.algorithmsMap = allDetections.reduce<Record<string, Detection[]>>(
      (map, currentDetection) => {
        if (map[currentDetection.algorithm]) {
          map[currentDetection.algorithm].push(currentDetection);
        } else {
          map[currentDetection.algorithm] = [currentDetection];
        }

        return map;
      },
      {},
    );

    console.log(this.algorithmsMap);
  }
}
