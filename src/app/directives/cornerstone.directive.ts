import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
} from '@angular/core';
import { ViewportData, ViewportsMap } from '../../models/viewport';
import {
  Coordinate2D,
  CornerstoneClickEvent,
  Detection,
  Dimension2D,
} from '../../models/detection';
import { DETECTION_STYLE } from '../../enums/detection-styles';
import {
  displayDetection,
  getBboxFromHandles,
  getBoundingBoxArea,
  pointInRect,
} from '../utilities/detection.utilities';
import { cornerstone, cornerstoneTools } from '../csSetup';
import { DetectionsService } from '../services/detections/detections.service';
import {
  getCreatedBoundingBox,
  resetCornerstoneTool,
  updateCornerstoneViewports,
} from '../utilities/cornerstone.utilities';
import BoundingBoxDrawingTool from '../utilities/cornerstone-tools/BoundingBoxDrawingTool';
import {
  AnnotationMode,
  CornerstoneMode,
  CS_EVENTS,
  EditionMode,
  ToolNames,
} from '../../enums/cornerstone';
import { CornerstoneService } from '../services/cornerstone/cornerstone.service';
import { CS_DEFAULT_CONFIGURATION } from '../../models/cornerstone';
import { renderBboxCrosshair } from '../utilities/drawing.utilities';
// import SegmentationDrawingTool from '../utilities/cornerstone-tools/SegmentationDrawingTool';
// import AnnotationMovementTool from '../utilities/cornerstone-tools/AnnotationMovementTool';
// TODO: get the actual selected category
const SELECTED_CATEGORY = '';
// TODO: get the actual edition mode
const CURRENT_EDITION_MODE = EditionMode.NoTool;

@Directive({
  selector: '[csDirective]',
  standalone: true,
})
export class CornerstoneDirective implements AfterViewInit {
  element: HTMLElement;
  @Input() viewportName: keyof ViewportsMap | null = null;
  private cornerstoneConfig = CS_DEFAULT_CONFIGURATION;
  private mousePosition: Coordinate2D = { x: 0, y: 0 };
  private imageDimensions: Dimension2D = { width: 0, height: 0 };
  private context: CanvasRenderingContext2D | null | undefined = undefined;
  private detections: Detection[] = [];

  constructor(
    public elementRef: ElementRef,
    private cornerstoneService: CornerstoneService,
    private detectionsService: DetectionsService,
  ) {
    this.element = elementRef.nativeElement;
    // track the position of the mouse
    document.body.addEventListener('mousemove', (e) => {
      this.mousePosition.x = e.clientX;
      this.mousePosition.y = e.clientY;
      if (this.isAnnotating()) {
        cornerstone.updateImage(this.element, false);
      }
    });
    this.cornerstoneService.getCsConfiguration().subscribe((config) => {
      this.cornerstoneConfig = config;
    });
    this.detectionsService.getDetectionData().subscribe((detections) => {
      this.detections = detections[this.viewportName!];
    });
  }

  @Input()
  set image({ imageData }: ViewportData) {
    if (!imageData?.imageId) return;
    cornerstone.enable(this.element);
    const enabledElement = cornerstone.getEnabledElement(this.element);
    this.context = enabledElement.canvas?.getContext('2d');
    this.detectionsService.clearSelectedDetection();
    this.displayImage(imageData);
    this.imageDimensions.height = imageData.height;
    this.imageDimensions.width = imageData.width;
  }

  @HostListener('mousewheel', ['$event'])
  onMouseWheel() {
    console.log('mouseWheel');
  }

  @HostListener(CS_EVENTS.CLICK, ['$event'])
  onMouseClick(event: CornerstoneClickEvent) {
    const canvas = event.detail?.currentPoints?.canvas;
    if (canvas) {
      const { x, y } = canvas;
      const mousePos = cornerstone.canvasToPixel(this.element, {
        _canvasCoordinateBrand: '',
        x: x,
        y: y,
      });
      let detClicked = false;
      for (let i = 0; i < this.detections.length; i++) {
        if (pointInRect(mousePos, this.detections[i].boundingBox)) {
          this.detectionsService.selectDetection(
            this.detections[i].uuid,
            this.detections[i].viewpoint,
          );
          detClicked = true;
          break;
        }
      }
      if (!detClicked) {
        this.detectionsService.clearSelectedDetection();
      }
      updateCornerstoneViewports();
    }
  }

  @HostListener('mouseup', ['$event'])
  onDragEnd() {
    this.handleBoundingBoxDetectionCreation();
  }

  @HostListener(CS_EVENTS.RENDER, ['$event'])
  onImageRender() {
    if (!this.context) {
      throw Error('Context is not set in image render handler');
    }
    const enabledElement = cornerstone.getEnabledElement(this.element);
    const zoom = enabledElement.viewport?.scale || 1;
    this.renderDetections(this.context, zoom);
    if (this.isAnnotating()) {
      renderBboxCrosshair(
        this.context,
        this.element,
        this.mousePosition,
        this.imageDimensions,
        zoom,
      );
    }
  }

  ngAfterViewInit() {
    // Enable the element with Cornerstone
    cornerstone.enable(this.element);

    const PanTool = cornerstoneTools.PanTool;
    cornerstoneTools.addTool(PanTool);
    cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 });

    const ZoomMouseWheelTool = cornerstoneTools.ZoomMouseWheelTool;
    cornerstoneTools.addTool(ZoomMouseWheelTool);
    cornerstoneTools.setToolActive('ZoomMouseWheel', {});

    const ZoomTouchPinchTool = cornerstoneTools.ZoomTouchPinchTool;
    cornerstoneTools.addTool(ZoomTouchPinchTool);
    cornerstoneTools.setToolActive('ZoomTouchPinch', { mouseButtonMask: 1 });

    cornerstoneTools.addTool(BoundingBoxDrawingTool);
  }

  displayImage(image: cornerstone.Image) {
    cornerstone.displayImage(this.element, image);
  }

  private handleBoundingBoxDetectionCreation() {
    const createdBoundingBox = getCreatedBoundingBox(this.element);
    if (createdBoundingBox === undefined) return;

    const bbox = getBboxFromHandles(createdBoundingBox.handles);
    const area = getBoundingBoxArea(bbox);

    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      annotationMode: AnnotationMode.NoTool,
    });

    if (area > 0) {
      this.detectionsService.addDetection(bbox, area, this.viewportName!);
      cornerstone.updateImage(this.element, false);
    }
    resetCornerstoneTool(ToolNames.BoundingBox, this.element);
  }

  /**
   * Returns true if the cornerstone mode is annotation
   * @private
   */
  private isAnnotating(): boolean {
    return (
      this.cornerstoneConfig.cornerstoneMode === CornerstoneMode.Annotation
    );
  }

  /**
   * Draws the detections on the given rendering context
   */
  private renderDetections(
    context: CanvasRenderingContext2D,
    zoom: number,
  ): void {
    const selectedDetection = this.detectionsService.getSelectedDetection();

    const { BORDER_WIDTH, FONT_DETAILS } = DETECTION_STYLE;
    context.font = FONT_DETAILS.get(zoom);
    context.lineWidth = BORDER_WIDTH / zoom;

    this.detections.forEach((det) =>
      displayDetection(
        context,
        det,
        selectedDetection,
        SELECTED_CATEGORY,
        CURRENT_EDITION_MODE,
        zoom,
      ),
    );
  }
}
