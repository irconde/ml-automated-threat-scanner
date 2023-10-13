import { Component } from '@angular/core';
import { Coordinate2D, Detection } from '../../../models/detection';
import { DetectionsService } from '../../services/detections/detections.service';
import { cornerstone } from '../../csSetup';
import { getViewportByViewpoint } from '../../utilities/cornerstone.utilities';
import { NgIf, NgStyle } from '@angular/common';
import { DynamicSvgComponent } from '../dynamic-svg/dynamic-svg.component';
import { CornerstoneService } from '../../services/cornerstone/cornerstone.service';

@Component({
  selector: 'app-detection-context-menu',
  templateUrl: './detection-context-menu.component.html',
  styleUrls: ['./detection-context-menu.component.scss'],
  standalone: true,
  imports: [NgStyle, NgIf, DynamicSvgComponent],
})
export class DetectionContextMenuComponent {
  color = 'blue';
  svgPath = 'assets/rectangle.svg';

  position: Coordinate2D | null = { x: 0, y: 0 };
  enablePositionOffset = false;
  showPolygonIcon = false;

  constructor(
    private detectionService: DetectionsService,
    private cornerstoneService: CornerstoneService,
  ) {
    this.detectionService
      .getSelectedDetection()
      .subscribe((selectedDetection) => {
        this.updatePosition(selectedDetection);
      });

    this.detectionService.getDetectionData().subscribe((detections) => {
      this.enablePositionOffset =
        detections.top.length > 0 && detections.side.length > 0;
    });
  }

  updatePosition(selectedDetection: Detection | null) {
    if (selectedDetection === null) {
      this.position = null;
      return;
    }
    this.showPolygonIcon = Boolean(
      'polygonMask' in selectedDetection &&
        selectedDetection?.polygonMask?.length,
    );
    const GAP = 5;
    const width = selectedDetection.boundingBox[2];
    const height = selectedDetection.boundingBox[3];
    const viewport: HTMLElement = getViewportByViewpoint(
      selectedDetection.viewpoint,
    );
    const viewportOffset =
      selectedDetection.viewpoint === 'side' && this.enablePositionOffset
        ? viewport.clientWidth
        : viewport.offsetLeft;
    console.log(selectedDetection.viewpoint);
    const { x, y } = cornerstone.pixelToCanvas(viewport, {
      x: selectedDetection.boundingBox[0] + width / 2,
      y: selectedDetection.boundingBox[1] + height,
      _pixelCoordinateBrand: '',
    });

    this.position = { x: x + viewportOffset, y: y + GAP };
  }

  handleContextMenuPosition() {
    return {
      left: (this.position?.x || 0) + 'px',
      top: `calc(${this.position?.y || 0}px + 3.375rem)`,
      display: this.position ? 'flex' : 'none',
    };
  }

  handleMenuItemClick(type: string) {
    switch (type) {
      case 'LABEL':
        console.log('Label Edit');
        break;
      case 'COLOR':
        console.log('Color Edit');
        break;
      case 'BOUNDING':
        console.log('Bounding Box Edit');
        break;
      case 'POLYGON':
        console.log('Polygon Mask Edit');
        break;
      case 'MOVE':
        console.log('Move');
        break;
      case 'DELETE':
        console.log('Delete');
        break;
      default:
        break;
    }
  }
}
