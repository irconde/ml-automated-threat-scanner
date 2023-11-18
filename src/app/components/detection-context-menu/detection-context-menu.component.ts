import { Component } from '@angular/core';
import { Coordinate2D, Detection } from '../../../models/detection';
import { DetectionsService } from '../../services/detections/detections.service';
import { cornerstone } from '../../csSetup';
import { getViewportByViewpoint } from '../../utilities/cornerstone.utilities';
import { NgIf, NgStyle } from '@angular/common';
import { ColorComponent } from '../svgs/color-svg/color-svg.component';
import { RectangleComponent } from '../svgs/rectangle-svg/rectangle-svg.component';
import { MovementComponent } from '../svgs/move-svg/movement-svg.component';
import { PolygonComponent } from '../svgs/polygon-svg/polygon-svg.component';
import { LabelComponent } from '../svgs/label-svg/label-svg.component';
import { DeleteComponent } from '../svgs/delete-svg/delete-svg.component';
import { LabelEditComponent } from '../label-edit/label-edit.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { CornerstoneService } from '../../services/cornerstone/cornerstone.service';
import {
  AnnotationMode,
  CornerstoneMode,
  EditionMode,
} from '../../../enums/cornerstone';

@Component({
  selector: 'app-detection-context-menu',
  templateUrl: './detection-context-menu.component.html',
  styleUrls: ['./detection-context-menu.component.scss'],
  standalone: true,
  imports: [
    NgStyle,
    NgIf,
    ColorComponent,
    RectangleComponent,
    MovementComponent,
    PolygonComponent,
    LabelComponent,
    DeleteComponent,
    LabelEditComponent,
    SideMenuComponent,
  ],
})
export class DetectionContextMenuComponent {
  position: Coordinate2D | null = { x: 0, y: 0 };
  enablePositionOffset = false;
  showPolygonIcon = false;
  detectionColor = '#ffffff';
  selectedDetection: Detection | null = null;
  show: boolean = false;
  readonly yGap = 5;

  constructor(
    private detectionService: DetectionsService,
    private csService: CornerstoneService,
  ) {
    this.detectionService
      .getSelectedDetection()
      .subscribe((selectedDetection) => {
        this.selectedDetection = selectedDetection;
        this.updatePosition(selectedDetection);
        this.detectionColor = selectedDetection?.color || '#ffffff';
      });

    this.detectionService.getDetectionData().subscribe((detections) => {
      this.enablePositionOffset =
        detections.top.length > 0 && detections.side.length > 0;
    });
  }

  private hideMenu() {
    this.show = false;
    this.position = null;
  }

  updatePosition(selectedDetection: Detection | null) {
    if (selectedDetection === null) {
      return this.hideMenu();
    }
    this.showPolygonIcon = Boolean(
      'polygonMask' in selectedDetection &&
        selectedDetection?.polygonMask?.length,
    );
    const width = selectedDetection.boundingBox[2];
    const height = selectedDetection.boundingBox[3];
    const viewport: HTMLElement = getViewportByViewpoint(
      selectedDetection.viewpoint,
    );
    const viewportOffset =
      selectedDetection.viewpoint === 'side' && this.enablePositionOffset
        ? viewport.clientWidth
        : viewport.offsetLeft;
    const { x, y } = cornerstone.pixelToCanvas(viewport, {
      x: selectedDetection.boundingBox[0] + width / 2,
      y: selectedDetection.boundingBox[1] + height,
      _pixelCoordinateBrand: '',
    });

    this.position = { x: x + viewportOffset, y: y + this.yGap };
    this.show = true;
  }

  private enableBoundingDetectionEdition() {
    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Edition,
      annotationMode: AnnotationMode.Bounding,
      editionMode: EditionMode.Bounding,
    });
    // this.resetCornerstoneTool();
    // const data = {
    //   handles: {
    //     start: {
    //       x: this.props.selectedDetection.boundingBox[0],
    //       y: this.props.selectedDetection.boundingBox[1],
    //     },
    //     end: {
    //       x: this.props.selectedDetection.boundingBox[2],
    //       y: this.props.selectedDetection.boundingBox[3],
    //     },
    //     start_prima: {
    //       x: this.props.selectedDetection.boundingBox[0],
    //       y: this.props.selectedDetection.boundingBox[3],
    //     },
    //     end_prima: {
    //       x: this.props.selectedDetection.boundingBox[2],
    //       y: this.props.selectedDetection.boundingBox[1],
    //     },
    //   },
    //   uuid: this.props.selectedDetection.uuid,
    //   algorithm: this.props.selectedDetection.algorithm,
    //   class: this.props.selectedDetection.className,
    //   renderColor: constants.detectionStyle.SELECTED_COLOR,
    //   confidence: this.props.selectedDetection.confidence,
    //   updatingDetection: true,
    //   view: this.props.selectedDetection.view,
    //   polygonCoords:
    //     this.props.selectedDetection.polygonMask !== null
    //       ? this.props.selectedDetection.polygonMask
    //       : undefined,
    //   binaryMask: this.props.selectedDetection.binaryMask,
    // };
    // if (
    //   this.props.selectedDetection.view === constants.viewport.TOP
    // ) {
    //   cornerstoneTools.addToolState(
    //     this.state.imageViewportTop,
    //     'BoundingBoxDrawing',
    //     data
    //   );
    // } else if (
    //   this.props.selectedDetection.view ===
    //   constants.viewport.SIDE
    // ) {
    //   cornerstoneTools.addToolState(
    //     this.state.imageViewportSide,
    //     'BoundingBoxDrawing',
    //     data
    //   );
    // }
    // cornerstoneTools.setToolActive('BoundingBoxDrawing', {
    //   mouseButtonMask: 1,
    // });
    // cornerstoneTools.setToolActive('Pan', {
    //   mouseButtonMask: 1,
    // });
    // cornerstoneTools.setToolOptions('BoundingBoxDrawing', {
    //   cornerstoneMode: constants.cornerstoneMode.EDITION,
    //   editionMode: constants.editionMode.NO_TOOL,
    // });
  }

  handleMenuItemClick(type: EditionMode) {
    switch (type) {
      case EditionMode.Label:
        return this.csService.setCsConfiguration({
          cornerstoneMode: CornerstoneMode.Edition,
          annotationMode: AnnotationMode.NoTool,
          editionMode: EditionMode.Label,
        });
      case EditionMode.Color:
        console.log('Color Edit');
        break;
      case EditionMode.Bounding:
        return this.enableBoundingDetectionEdition();
      case EditionMode.Polygon:
        console.log('Polygon Mask Edit');
        break;
      case EditionMode.Move:
        console.log('Move');
        break;
      case EditionMode.Delete:
        console.log('Delete');
        break;
      default:
        break;
    }
  }

  protected readonly EditionMode = EditionMode;
}
