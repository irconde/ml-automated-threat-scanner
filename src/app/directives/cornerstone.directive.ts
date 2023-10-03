import {AfterViewInit, Directive, ElementRef, HostListener, Input,} from '@angular/core';
import {ViewportData, ViewportsMap} from '../../models/viewport';
import {Coordinate2D, CornerstoneClickEvent, Detection, Dimension2D,} from '../../models/detection';
import {DETECTION_STYLE} from '../../enums/detection-styles';
import {displayDetection, getBboxFromHandles, getBoundingBoxArea, pointInRect,} from '../utilities/detection.utilities';
import {cornerstone} from '../csSetup';
import {DetectionsService} from '../services/detections/detections.service';
import {
  getCreatedBoundingBoxFromTool,
  getCreatedPolygonFromTool,
  resetCornerstoneTool,
  updateCornerstoneViewports,
} from '../utilities/cornerstone.utilities';
import {AnnotationMode, CornerstoneMode, CS_EVENTS, EditionMode, ToolNames,} from '../../enums/cornerstone';
import {CornerstoneService} from '../services/cornerstone/cornerstone.service';
import {CS_DEFAULT_CONFIGURATION} from '../../models/cornerstone';
import {renderBboxCrosshair} from '../utilities/drawing.utilities';
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
  private isClickListenerActive = false;

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
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      this.handleExitingAnnotationMode();
    });
    this.cornerstoneService.getCsConfiguration().subscribe((config) => {
      this.cornerstoneConfig = config;
      if (config.cornerstoneMode === CornerstoneMode.Annotation) {
        this.stopListeningToCLicks();
      } else {
        this.listenToClicks();
      }
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

  listenToClicks() {
    if (this.isClickListenerActive) return;
    setTimeout(() => {
      // Delay listening for click events until the new detection is created and selected
      // adding the listener without delay causes the click event to be triggered too soon
      // which deselects the newly created detection
      this.element.addEventListener(CS_EVENTS.CLICK, this.onMouseClick);
      this.isClickListenerActive = true;
    }, 200);
  }

  stopListeningToCLicks() {
    if (!this.isClickListenerActive) return;
    console.log('STOP LISTENING');
    this.element.removeEventListener(CS_EVENTS.CLICK, this.onMouseClick);
    this.isClickListenerActive = false;
  }

  /**
   * Runs after onDragEnd event
   * @param event
   */
  // @HostListener(CS_EVENTS.CLICK, ['$event'])
  onMouseClick = (event: CornerstoneClickEvent) => {
    console.log('onMouseClick()');
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
      if (detClicked) {
        this.cornerstoneService.setCsConfiguration({
          cornerstoneMode: CornerstoneMode.Edition,
          annotationMode: AnnotationMode.NoTool,
        });
      } else {
        this.handleEmptyAreaClick();
      }
      updateCornerstoneViewports();
    }
  };

  /**
   * Runs when a polygon mask has been fully drawn. This event is triggered by the PolygonDrawingTool
   */
  @HostListener(CS_EVENTS.POLYGON_MASK_CREATED, ['$event'])
  onPolygonEnd(event: Event) {
    console.log('onPolygonEnd()');
    const createdPolygon = getCreatedPolygonFromTool(this.element);
    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Edition,
      annotationMode: AnnotationMode.NoTool,
    });

    if (createdPolygon === undefined) {
      console.warn('Polygon tool state is undefined');
      return;
    }
    event.stopPropagation();
    this.detectionsService.addDetection(
      this.viewportName!,
      createdPolygon.bbox,
      createdPolygon.polygonMask,
    );
    updateCornerstoneViewports();
    resetCornerstoneTool(ToolNames.Polygon, this.element);
  }

  /**
   * Runs on mouseup event before the onMouseClick event
   */
  @HostListener('mouseup', ['$event'])
  onDragEnd() {
    console.log('onDragEnd()');
    if (this.cornerstoneConfig.annotationMode === AnnotationMode.Bounding) {
      this.handleBoundingBoxDetectionCreation();
    }
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
    this.element.addEventListener(CS_EVENTS.CLICK, this.onMouseClick);
  }

  displayImage(image: cornerstone.Image) {
    cornerstone.displayImage(this.element, image);
  }

  private handleBoundingBoxDetectionCreation() {
    const createdBoundingBox = getCreatedBoundingBoxFromTool(this.element);
    if (createdBoundingBox === undefined) return;

    const bbox = getBboxFromHandles(createdBoundingBox.handles);
    const area = getBoundingBoxArea(bbox);

    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Edition,
      annotationMode: AnnotationMode.NoTool,
    });

    if (area > 0) {
      this.detectionsService.addDetection(this.viewportName!, bbox, undefined);
      updateCornerstoneViewports();
    }
    resetCornerstoneTool(ToolNames.BoundingBox, this.element);
    console.log('doneCreatingBounding');
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

  private handleEmptyAreaClick() {
    this.detectionsService.clearSelectedDetection();
    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      annotationMode: AnnotationMode.NoTool,
    });
  }

  /**
   * Runs when the escape key is pressed. If the mode is annotation then we reset the tool's state
   * @private
   */
  private handleExitingAnnotationMode() {
    if (!this.isAnnotating()) return;
    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      annotationMode: AnnotationMode.NoTool,
    });
    resetCornerstoneTool(ToolNames.BoundingBox, this.element);
    cornerstone.updateImage(this.element, false);
  }
}
