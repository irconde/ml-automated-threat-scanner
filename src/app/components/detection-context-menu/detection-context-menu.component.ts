import { Component, OnDestroy } from '@angular/core';
import { Coordinate2D, Detection } from '../../../models/detection';
import { DetectionsService } from '../../services/detections/detections.service';
import { cornerstone } from '../../csSetup';
import {
  getViewportByViewpoint,
  resetAllViewportsCsTools,
  setBoundingEditToolActive,
  setMovementToolActive,
  setPolygonEditToolActive,
  updateCornerstoneViewports,
} from '../../utilities/cornerstone.utilities';
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
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EventBusService } from '../../services/event-bus/event-bus.service';
import { Subscription } from 'rxjs';

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
    MatTooltipModule,
    MatButtonModule,
    MatMenuModule,
    ColorPickerComponent,
  ],
})
export class DetectionContextMenuComponent implements OnDestroy {
  position: Coordinate2D | null = { x: 0, y: 0 };
  enablePositionOffset = false;
  showPolygonIcon = false;
  detectionColor = '#ffffff';
  selectedDetection: Detection | null = null;
  visible: boolean = false;
  editionMode: EditionMode = EditionMode.NoTool;
  readonly yGap = 5;
  eventSubscriptions: Subscription[] = [];

  constructor(
    private detectionService: DetectionsService,
    private csService: CornerstoneService,
    private eventBusService: EventBusService,
  ) {
    this.csService.getCsConfiguration().subscribe((config) => {
      const hideMenuMode = this.isEditionBoundOrPoly(config.editionMode);

      // if menu is visible and edition mode is changed to bounding or polygon
      if (this.visible && hideMenuMode) {
        this.hideMenu();
      }
      // the current mode is bounding or polygon, and it just got updated to something else
      else if (this.isEditionBoundOrPoly(this.editionMode) && !hideMenuMode) {
        this.visible = true;
      }
      this.editionMode = config.editionMode;
    });
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

    const wheelStartSub = this.eventBusService.wheelEventStart$.subscribe(
      () => {
        this.hideMenu();
      },
    );
    const wheelEndSub = this.eventBusService.wheelEventEnd$.subscribe(() => {
      if (this.selectedDetection === null) return;
      this.updatePosition(this.selectedDetection);
    });
    this.eventSubscriptions.push(wheelStartSub, wheelEndSub);
  }

  updateDetectionColor() {
    return this.selectedDetection!.color;
  }

  private hideMenu() {
    this.visible = false;
    this.position = null;
  }

  private isEditionBoundOrPoly(mode: EditionMode) {
    return mode === EditionMode.Bounding || mode === EditionMode.Polygon;
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
    this.visible = true;
  }

  private enableBoundingDetectionEdition() {
    if (this.selectedDetection === null) return;
    // the tool will be deactivated in the 'cornerstone.directive' in the onDragEnd event handler
    setBoundingEditToolActive(this.selectedDetection);
    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Edition,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.Bounding,
    });
  }

  private enablePolygonDetectionEdition() {
    if (this.selectedDetection === null) return;
    setPolygonEditToolActive(this.selectedDetection);
    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Edition,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.Polygon,
    });
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
        return this.csService.setCsConfiguration({
          cornerstoneMode: CornerstoneMode.Edition,
          annotationMode: AnnotationMode.NoTool,
          editionMode: EditionMode.Color,
        });
      case EditionMode.Bounding:
        return this.enableBoundingDetectionEdition();
      case EditionMode.Polygon:
        return this.enablePolygonDetectionEdition();
      case EditionMode.Move:
        return this.enableMovementTool();
      case EditionMode.Delete:
        return this.handleDetectionDeletion();
      default:
        break;
    }
  }

  protected readonly EditionMode = EditionMode;

  private enableMovementTool() {
    if (this.selectedDetection === null) return;

    setMovementToolActive(this.selectedDetection);
    // reset the movement tool if the user clicks
    // added hear in case user switches tools while the movement tool is activated
    document.addEventListener(
      'click',
      () => {
        this.csService.setCsConfiguration({
          cornerstoneMode: CornerstoneMode.Edition,
          annotationMode: AnnotationMode.NoTool,
          editionMode: EditionMode.NoTool,
        });
        resetAllViewportsCsTools();
      },
      { once: true, capture: true },
    );
    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Edition,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.Move,
    });
  }

  private handleDetectionDeletion() {
    this.detectionService.deleteSelectedDetection();
    // update the cs configuration to remove detection widgets if any are open
    this.csService.setCsConfiguration({
      editionMode: EditionMode.NoTool,
      annotationMode: AnnotationMode.NoTool,
      cornerstoneMode: CornerstoneMode.Selection,
    });
    // rerender the ports to remove the detection
    updateCornerstoneViewports();
  }

  ngOnDestroy(): void {
    this.eventSubscriptions.forEach((sub) => sub.unsubscribe());
  }
}
