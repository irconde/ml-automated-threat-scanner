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
  getCreatedPolygonFromTool,
  resetCornerstoneTool,
  resetCornerstoneTools,
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
import { BoundingEditToolState } from '../../models/cornerstone-tools.types';
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
    private settingsService: SettingsService,
  ) {
    this.element = elementRef.nativeElement;
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
    this.cornerstoneService.getCsConfiguration().subscribe((config) => {
      this.cornerstoneConfig = config;
      if (
        config.cornerstoneMode === CornerstoneMode.Annotation ||
        config.editionMode === EditionMode.Bounding ||
        config.editionMode === EditionMode.Polygon
      ) {
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
    this.detectionsService.clearDetectionsSelection();
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
      this.element.addEventListener('click', this.onMouseClick);
      this.element.addEventListener('touchstart', this.onMouseClick);
      this.isClickListenerActive = true;
    }, 200);
  }

  stopListeningToCLicks() {
    if (!this.isClickListenerActive) return;
    this.element.removeEventListener('click', this.onMouseClick);
    this.element.removeEventListener('touchstart', this.onMouseClick);
    this.isClickListenerActive = false;
  }

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
      this.cornerstoneService.setCsConfiguration({
        cornerstoneMode: CornerstoneMode.Edition,
        annotationMode: AnnotationMode.NoTool,
        editionMode: EditionMode.NoTool,
      });
    } else {
      this.handleEmptyAreaClick();
    }
  };

  /**
   * Runs when a polygon mask has been fully drawn. This event is triggered by the PolygonDrawingTool
   */
  @HostListener(CS_EVENTS.POLYGON_MASK_CREATED, ['$event'])
  onPolygonEnd(event: Event) {
    const createdPolygon = getCreatedPolygonFromTool(this.element);
    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Edition,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.NoTool,
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
  @HostListener('touchend')
  onDragEnd() {
    console.log('onDragEnd');
    if (this.cornerstoneConfig.annotationMode === AnnotationMode.Bounding) {
      this.handleBoundingBoxDetectionCreation();
    } else if (this.cornerstoneConfig.editionMode === EditionMode.Bounding) {
      this.handleBoundingBoxDetectionEdition();
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

  private handleBoundingBoxDetectionCreation() {
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

    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: cornerstoneMode,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.Label,
    });

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

  private shouldShowCrosshair(): boolean {
    return (
      // if annotating on a NON mobile device
      (this.isAnnotating() && !this.settingsService.isMobile) ||
      // if annotating a bounding box on mobile
      (this.cornerstoneConfig.annotationMode === AnnotationMode.Bounding &&
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
            CURRENT_EDITION_MODE,
            zoom,
          ),
        );
      });

    subscription.unsubscribe();
  }

  private handleEmptyAreaClick() {
    this.detectionsService.clearDetectionsSelection();
    this.cornerstoneService.setCsConfiguration({
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
    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.NoTool,
    });
    resetCornerstoneTool(ToolNames.BoundingBox, this.element);
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

  private handleBoundingBoxDetectionEdition() {
    // toolState = cornerstoneTools.getToolState(
    //   viewportRef.current,
    //   constants.toolNames.boundingBox
    // );
    // if (toolState !== undefined && toolState.data.length > 0) {
    //   const { data } = toolState;
    //   const { handles, id, segmentation } = data[0];
    //   let bbox = Utils.getBboxFromHandles(
    //     handles.start,
    //     handles.end
    //   );
    //   const newSegmentation = [];
    //   if (segmentation?.length > 0) {
    //     segmentation.forEach((segment) => {
    //       newSegmentation.push(
    //         Utils.calculatePolygonMask(bbox, segment)
    //       );
    //     });
    //   }
    //   // Converting from
    //   // [x_0, y_0, x_f, y_f]
    //   // to
    //   // [x_0, y_0, width, height]
    //   bbox[2] = bbox[2] - bbox[0];
    //   bbox[3] = bbox[3] - bbox[1];
    //   dispatch(
    //     updateEditionMode(constants.editionMode.NO_TOOL)
    //   );
    //   dispatch(
    //     updateCornerstoneMode(
    //       constants.cornerstoneMode.EDITION
    //     )
    //   );
    //   dispatch(updateAnnotationContextVisibility(true));
    //   Utils.dispatchAndUpdateImage(
    //     dispatch,
    //     updateAnnotationPosition,
    //     { id, bbox: bbox, segmentation: newSegmentation }
    //   );
    //   Utils.resetCornerstoneTools(viewportRef.current);
    // }

    const toolState: BoundingEditToolState = cornerstoneTools.getToolState(
      this.element,
      ToolNames.BoundingBox,
    );
    if (toolState === undefined || toolState.data.length === 0) {
      return;
    }

    const { handles, id, segmentation } = toolState.data[0];

    const bbox = getBboxFromHandles({ start: handles.start, end: handles.end });
    const newSegmentation = [];
    if (segmentation?.length) {
      segmentation.forEach((segment) => {
        newSegmentation.push(calculatePolygonMask(bbox, segment));
      });
    }

    // Converting from
    // [x_0, y_0, x_f, y_f]
    // to
    // [x_0, y_0, width, height]
    bbox[2] = bbox[2] - bbox[0];
    bbox[3] = bbox[3] - bbox[1];

    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      editionMode: EditionMode.NoTool,
      annotationMode: AnnotationMode.NoTool,
    });

    // TODO: update selected detection here
    resetCornerstoneTools(this.element);
  }
}
