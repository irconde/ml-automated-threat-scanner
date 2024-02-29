import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
} from '@angular/core';
import { ViewportData, ViewportsMap } from '../../models/viewport';
import { Coordinate2D, Detection, Dimension2D } from '../../models/detection';
import { DETECTION_STYLE } from '../../enums/detection-styles';
import {
  calculatePolygonMask,
  displayDetection,
  getBboxFromHandles,
  getBoundingBoxArea,
  pointInRect,
} from '../utilities/detection.utilities';
import { cornerstone, cornerstoneTools } from '../csSetup';
import { DetectionsService } from '../services/detections/detections.service';
import {
  getCreatedBoundingBoxFromTool,
  getMovementToolState,
  getPolygonFromTool,
  isModeAnyOf,
  resetCsToolByViewport,
  resetViewportCsTools,
  updateCornerstoneViewports,
} from '../utilities/cornerstone.utilities';
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
import { SettingsService } from '../services/settings/settings.service';
import {
  BoundingEditToolState,
  PolygonToolPayload,
} from '../../models/cornerstone-tools.types';
import { EventBusService } from '../services/event-bus/event-bus.service';
import { debounceTime, fromEvent } from 'rxjs';

@Directive({
  // eslint-disable-next-line @angular-eslint/directive-selector
  selector: '[csDirective]',
  standalone: true,
})
export class CornerstoneDirective implements AfterViewInit {
  element: HTMLElement;
  @Input() viewportName: keyof ViewportsMap | null = null;
  private csConfig = CS_DEFAULT_CONFIGURATION;
  private mousePosition: Coordinate2D = { x: 0, y: 0 };
  private imageDimensions: Dimension2D = { width: 0, height: 0 };
  private context: CanvasRenderingContext2D | null | undefined = undefined;
  private detections: Detection[] = [];
  private isClickListenerActive = false;

  constructor(
    public elementRef: ElementRef,
    private csService: CornerstoneService,
    private detectionsService: DetectionsService,
    private settingsService: SettingsService,
    private eventBusService: EventBusService,
  ) {
    this.element = elementRef.nativeElement;
    this.listenToWheelEvent();
    this.listenToDragEvent();

    // track the position of the mouse
    const handleMouseAndMove = (e: MouseEvent | TouchEvent) => {
      if (e instanceof MouseEvent) {
        this.mousePosition.x = e.clientX;
        this.mousePosition.y = e.clientY;
      } else {
        this.mousePosition.x = e.touches[0].clientX;
        this.mousePosition.y = e.touches[0].clientY;
      }

      if (this.shouldShowCrosshair()) {
        cornerstone.updateImage(this.element, false);
      }
    };
    document.body.addEventListener('mousemove', handleMouseAndMove);
    document.body.addEventListener('touchmove', handleMouseAndMove);
    document.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      this.handleExitingAnnotationMode();
    });
    this.csService.getCsConfiguration().subscribe((config) => {
      this.csConfig = config;
      const isEditingPolygon = config.editionMode === EditionMode.Polygon;
      if (
        config.cornerstoneMode === CornerstoneMode.Annotation ||
        isModeAnyOf(
          config.editionMode,
          EditionMode.Bounding,
          EditionMode.Polygon,
          EditionMode.Move,
        )
      ) {
        this.stopListeningToClicks();
        if (isEditingPolygon) {
          // cornerstone polygon tool doesn't rerender the image when a polygon is being edited
          if (this.settingsService.isMobile) {
            this.element.addEventListener(
              CS_EVENTS.TOUCH_DRAG,
              this.onPolygonRender,
            );
          } else {
            this.element.addEventListener(
              CS_EVENTS.MOUSE_DRAG,
              this.onPolygonRender,
            );
          }
        }
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
    this.detectionsService.clearDetectionsSelection();
    this.displayImage(imageData);
    this.imageDimensions.height = imageData.height;
    this.imageDimensions.width = imageData.width;
  }

  listenToClicks() {
    if (this.isClickListenerActive) return;
    setTimeout(() => {
      // Delay listening for click events until the new detection is created and selected
      // adding the listener without delay causes the click event to be triggered too soon
      // which deselects the newly created detection
      this.element.addEventListener('click', this.onMouseClick);
      this.element.addEventListener('touchstart', this.onMouseClick);
      this.isClickListenerActive = true;
    }, 200);
  }

  stopListeningToClicks() {
    if (!this.isClickListenerActive) return;
    this.element.removeEventListener('click', this.onMouseClick);
    this.element.removeEventListener('touchstart', this.onMouseClick);
    this.isClickListenerActive = false;
  }

  private onPolygonRender = () => {
    cornerstone.updateImage(this.element, true);
  };

  /**
   * Runs after onDragEnd event
   * @param event
   */
  onMouseClick = (event: MouseEvent | TouchEvent) => {
    const mousePos = this.getCanvasClickPosition(event);
    let detClicked = false;
    for (let i = 0; i < this.detections.length; i++) {
      const detection = this.detections[i];
      const isPointInRect = pointInRect(
        mousePos,
        this.detections[i].boundingBox,
      );
      if (isPointInRect && !detection.selected && detection.visible) {
        this.detectionsService.selectDetection(
          detection.uuid,
          detection.viewpoint,
        );
        detClicked = true;
        break;
      } else if (isPointInRect && detection.selected) {
        detClicked = false;
        break;
      }
    }
    if (detClicked) {
      this.csService.setCsConfiguration({
        cornerstoneMode: CornerstoneMode.Edition,
        annotationMode: AnnotationMode.NoTool,
        editionMode: EditionMode.NoTool,
      });
    } else {
      this.handleEmptyAreaClick();
    }
  };

  private handlePolygonCreation(createdPolygon: PolygonToolPayload) {
    console.log('Polygon created');
    this.detectionsService.addDetection(
      this.viewportName!,
      createdPolygon.bbox,
      createdPolygon.polygonMask,
    );
  }

  private handlePolygonEdition(editedPolygon: PolygonToolPayload) {
    console.log('Polygon edition');
    this.detectionsService.updateSelectedDetection(
      editedPolygon.bbox,
      editedPolygon.polygonMask,
    );
    if (this.settingsService.isMobile) {
      this.element.removeEventListener(
        CS_EVENTS.TOUCH_DRAG,
        this.onPolygonRender,
      );
    } else {
      this.element.removeEventListener(
        CS_EVENTS.MOUSE_DRAG,
        this.onPolygonRender,
      );
    }
  }

  /**
   * Runs when a polygon mask has been fully drawn. This event is triggered by the PolygonDrawingTool
   */
  @HostListener(CS_EVENTS.POLYGON_MASK_CREATED, ['$event'])
  onPolygonEnd(event: Event) {
    event.stopPropagation();
    const polygonToolPayload = getPolygonFromTool(this.element);
    if (polygonToolPayload === undefined) {
      console.warn('Polygon tool state is undefined');
    } else if (this.csConfig.annotationMode === AnnotationMode.Polygon) {
      this.handlePolygonCreation(polygonToolPayload);
    } else {
      this.handlePolygonEdition(polygonToolPayload);
    }

    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Edition,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.NoTool,
    });

    updateCornerstoneViewports();
    resetCsToolByViewport(ToolNames.Polygon, this.element);
  }

  /**
   * Runs on mouseup event before the onMouseClick event
   */
  @HostListener('mouseup', ['$event'])
  @HostListener('touchend')
  onDragEnd() {
    if (this.csConfig.annotationMode === AnnotationMode.Bounding) {
      this.handleBboxCreation();
    } else if (this.csConfig.editionMode === EditionMode.Bounding) {
      this.handleBboxEdition();
    } else if (this.csConfig.editionMode === EditionMode.Move) {
      this.handleDetectionMovement();
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
    if (this.shouldShowCrosshair()) {
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
    this.element.addEventListener('click', this.onMouseClick);
    this.element.addEventListener('touchstart', this.onMouseClick);
  }

  displayImage(image: cornerstone.Image) {
    cornerstone.displayImage(this.element, image);
  }

  private handleBboxCreation() {
    const createdBoundingBox = getCreatedBoundingBoxFromTool(this.element);
    if (createdBoundingBox === undefined) return;

    const bbox = getBboxFromHandles(createdBoundingBox.handles);
    const area = getBoundingBoxArea(bbox);

    let cornerstoneMode = CornerstoneMode.Selection;
    if (area > 0) {
      cornerstoneMode = CornerstoneMode.Edition;
      this.detectionsService.addDetection(this.viewportName!, bbox, undefined);
      updateCornerstoneViewports();
    }

    this.csService.setCsConfiguration({
      cornerstoneMode: cornerstoneMode,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.Label,
    });

    resetCsToolByViewport(ToolNames.BoundingBox, this.element);
  }

  /**
   * Returns true if the cornerstone mode is annotation
   * @private
   */
  private isAnnotating(): boolean {
    return this.csConfig.cornerstoneMode === CornerstoneMode.Annotation;
  }

  private shouldShowCrosshair(): boolean {
    return (
      // if annotating on a NON mobile device
      (this.isAnnotating() && !this.settingsService.isMobile) ||
      // if annotating a bounding box on mobile
      (this.csConfig.annotationMode === AnnotationMode.Bounding &&
        this.settingsService.isMobile)
    );
  }

  /**
   * Draws the detections on the given rendering context
   */
  private renderDetections(
    context: CanvasRenderingContext2D,
    zoom: number,
  ): void {
    const subscription = this.detectionsService
      .getSelectedDetection()
      .subscribe((selectedDetection) => {
        const { BORDER_WIDTH, FONT_DETAILS } = DETECTION_STYLE;
        context.font = FONT_DETAILS.get(zoom);
        context.lineWidth = BORDER_WIDTH / zoom;

        const anyDetectionsSelected = Boolean(
          selectedDetection ||
            this.detectionsService.allDetections.some((det) => det.selected),
        );

        this.detections.forEach((det) =>
          displayDetection(
            context,
            det,
            anyDetectionsSelected,
            this.csConfig.editionMode,
            zoom,
          ),
        );
      });

    subscription.unsubscribe();
  }

  private handleEmptyAreaClick() {
    this.detectionsService.clearDetectionsSelection();
    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.NoTool,
    });
  }

  /**
   * Runs when the escape key is pressed. If the mode is annotation then we reset the tool's state
   * @private
   */
  private handleExitingAnnotationMode() {
    if (!this.isAnnotating()) return;
    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.NoTool,
    });
    resetCsToolByViewport(ToolNames.BoundingBox, this.element);
    cornerstone.updateImage(this.element, false);
  }

  /**
   * Given a click or touch event on the canvas, it returns the pixel coordinate of the click or touch
   * @param event
   * @private
   */
  private getCanvasClickPosition(
    event: MouseEvent | TouchEvent,
  ): cornerstone.PixelCoordinate {
    let clientX;
    let clientY;
    if (event instanceof MouseEvent) {
      clientX = event.clientX;
      clientY = event.clientY;
    } else {
      clientX = event.touches[0].clientX;
      clientY = event.touches[0].clientY;
    }

    const x = clientX - this.element.getBoundingClientRect().left;
    const y = clientY - this.element.getBoundingClientRect().top;

    return cornerstone.canvasToPixel(this.element, {
      _canvasCoordinateBrand: '',
      x: x,
      y: y,
    });
  }

  private handleBboxEdition() {
    const toolState: BoundingEditToolState = cornerstoneTools.getToolState(
      this.element,
      ToolNames.BoundingBox,
    );
    if (toolState === undefined || toolState.data.length === 0) {
      return;
    }

    const { handles, segmentation } = toolState.data[0];
    const bbox = getBboxFromHandles({ start: handles.start, end: handles.end });

    const calculatedPolygonMask = segmentation
      ? calculatePolygonMask(
          [bbox[0], bbox[1], bbox[0] + bbox[2], bbox[1] + bbox[3]],
          segmentation,
        )
      : undefined;

    this.detectionsService.updateSelectedDetection(bbox, calculatedPolygonMask);

    resetViewportCsTools(this.element);
    cornerstone.updateImage(this.element, false);

    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      editionMode: EditionMode.NoTool,
      annotationMode: AnnotationMode.NoTool,
    });
  }

  private handleDetectionMovement() {
    const toolState = getMovementToolState(this.element);
    if (toolState) {
      this.detectionsService.updateSelectedDetection(
        toolState.bbox,
        toolState.polygonMask,
      );
    }
    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Edition,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.NoTool,
    });

    resetViewportCsTools(this.element);
  }

  private listenToWheelEvent() {
    // debounceTime enables getting notified of the wheel event
    // when it hasn't occurred for 200ms
    const endSub = fromEvent(this.element, 'wheel')
      .pipe(debounceTime(200))
      .subscribe((e) => {
        this.eventBusService.emitWheelEventEnd(e);
        endSub.unsubscribe();

        this.listenToWheelEvent();
      });

    const subscription = fromEvent(this.element, 'wheel').subscribe((e) => {
      this.eventBusService.emitWheelEventStart(e);

      subscription.unsubscribe();
    });
  }

  private listenToDragEvent() {
    const subscription = fromEvent(
      this.element,
      CS_EVENTS.MOUSE_DRAG,
    ).subscribe((e) => {
      this.eventBusService.emitDragEventStart(e);

      this.stopListeningToClicks();

      const endSub = fromEvent(this.element, 'mouseup').subscribe((e) => {
        this.eventBusService.emitDragEventEnd(e);

        endSub.unsubscribe();

        this.listenToDragEvent();
        // don't listen to clicks when drawing a polygon
        if (this.csConfig.annotationMode !== AnnotationMode.Polygon) {
          this.listenToClicks();
        }
      });

      subscription.unsubscribe();
    });
  }
}
