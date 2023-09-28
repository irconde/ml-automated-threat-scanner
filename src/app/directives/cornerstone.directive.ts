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
  getTextLabelSize,
  hexToCssRgba,
  limitCharCount,
} from '../utilities/text.utilities';
import {
  getBboxFromHandles,
  pointInRect,
  renderBinaryMasks,
  renderPolygonMasks,
} from '../utilities/detection.utilities';
import { cornerstone, cornerstoneTools } from '../csSetup';
import { DetectionsService } from '../services/detections/detections.service';
import {
  getCreatedBoundingBox,
  resetCornerstoneTool,
  updateCornerstoneViewport,
} from '../utilities/cornerstone.utilities';
import BoundingBoxDrawingTool from '../utilities/cornerstone-tools/BoundingBoxDrawingTool';
import {
  AnnotationMode,
  CornerstoneMode,
  EditionMode,
  ToolNames,
} from '../../enums/cornerstone';
import { CornerstoneService } from '../services/cornerstone/cornerstone.service';
import { CS_DEFAULT_CONFIGURATION } from '../../models/cornerstone';
import { renderBboxCrosshair } from '../utilities/drawing.utilities';
// import SegmentationDrawingTool from '../utilities/cornerstone-tools/SegmentationDrawingTool';
// import AnnotationMovementTool from '../utilities/cornerstone-tools/AnnotationMovementTool';

@Directive({
  selector: '[csDirective]',
  standalone: true,
})
export class CornerstoneDirective implements AfterViewInit {
  element: HTMLElement;
  @Input() viewportName: keyof ViewportsMap | null = null;
  private renderListener: ((e: Event) => void) | undefined = undefined;
  private cornerstoneConfig = CS_DEFAULT_CONFIGURATION;
  private mousePosition: Coordinate2D = { x: 0, y: 0 };
  private imageDimensions: Dimension2D = { width: 0, height: 0 };
  private context: CanvasRenderingContext2D | null | undefined = undefined;
  private clickListener: ((event: CornerstoneClickEvent) => void) | undefined =
    undefined;
  private readonly CS_EVENT = {
    RENDER: 'cornerstoneimagerendered',
    CLICK: 'cornerstonetoolsmouseclick',
  };

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
      console.log(detections);
    });
  }

  @Input()
  set image({ imageData, detectionData }: ViewportData) {
    if (!imageData?.imageId) return;
    cornerstone.enable(this.element);
    const enabledElement = cornerstone.getEnabledElement(this.element);
    this.context = enabledElement.canvas?.getContext('2d');
    this.detectionsService.clearSelectedDetection();
    this.displayImage(imageData);
    this.imageDimensions.height = imageData.height;
    this.imageDimensions.width = imageData.width;

    if (this.context) {
      const handleImageRender = (event: Event) => {
        if (!this.context) {
          throw Error('Context is not set in image render handler');
        }
        this.renderDetections(
          this.context,
          detectionData,
          enabledElement.viewport?.scale,
        );
        if (this.isAnnotating()) {
          renderBboxCrosshair(
            this.context,
            this.element,
            this.mousePosition,
            this.imageDimensions,
          );
        }
        this.renderListener = handleImageRender;
      };
      const onMouseClicked = (event: CornerstoneClickEvent): void => {
        const canvas = event.detail?.currentPoints?.canvas;
        if (canvas) {
          const { x, y } = canvas;
          const mousePos = cornerstone.canvasToPixel(this.element, {
            _canvasCoordinateBrand: '',
            x: x,
            y: y,
          });
          let detClicked = false;
          for (let i = 0; i < detectionData.length; i++) {
            if (pointInRect(mousePos, detectionData[i].boundingBox)) {
              this.detectionsService.selectDetection(
                detectionData[i].uuid,
                detectionData[i].viewpoint,
              );
              detClicked = true;
              break;
            }
          }
          if (!detClicked) {
            this.detectionsService.clearSelectedDetection();
          }
          updateCornerstoneViewport();
        }

        this.clickListener = onMouseClicked;
      };
      if (this.renderListener) {
        this.element.removeEventListener(
          cornerstone.EVENTS.IMAGE_RENDERED,
          this.renderListener,
        );
        this.element.addEventListener(
          cornerstone.EVENTS.IMAGE_RENDERED,
          handleImageRender,
        );
      }

      if (this.clickListener) {
        this.element.removeEventListener(this.CS_EVENT.CLICK, onMouseClicked);
      }
      this.element.addEventListener(this.CS_EVENT.RENDER, handleImageRender);
      this.element.addEventListener(this.CS_EVENT.CLICK, onMouseClicked);
    }
  }

  @HostListener('mousewheel', ['$event'])
  onMouseWheel() {
    console.log('mouseWheel');
  }

  @HostListener('mouseup', ['$event'])
  onDragEnd(event: any) {
    console.log('drag end');
    this.handleBoundingBoxDetectionCreation();
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
    console.log(createdBoundingBox);
    const bbox = getBboxFromHandles(createdBoundingBox.handles);
    // this.detectionsService
    console.log(bbox);
    const area = Math.abs((bbox[0] - bbox[2]) * (bbox[1] - bbox[3]));
    // // Converting from
    // // [x_0, y_0, x_f, y_f]
    // // to
    // // [x_0, y_0, width, height]
    bbox[2] = bbox[2] - bbox[0];
    bbox[3] = bbox[3] - bbox[1];
    this.cornerstoneService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      annotationMode: AnnotationMode.NoTool,
    });
    resetCornerstoneTool(ToolNames.BoundingBox, this.element);

    this.detectionsService.addDetection(bbox, area, this.viewportName!);
    cornerstone.updateImage(this.element, true);
    // let bbox = Utils.getBboxFromHandles(
    //   handles.start,
    //   handles.end
    // );
    // const area = Math.abs(
    //   (bbox[0] - bbox[2]) * (bbox[1] - bbox[3])
    // );
    // // Converting from
    // // [x_0, y_0, x_f, y_f]
    // // to
    // // [x_0, y_0, width, height]
    // bbox[2] = bbox[2] - bbox[0];
    // bbox[3] = bbox[3] - bbox[1];
    // dispatch(
    //   updateAnnotationMode(
    //     constants.annotationMode.NO_TOOL
    //   )
    // );
    // dispatch(
    //   updateCornerstoneMode(
    //     constants.cornerstoneMode.SELECTION
    //   )
    // );
    // if (area > 0) {
    //   if (annotationRef.current.length === 0) {
    //     dispatch(setSideMenu(false));
    //   }
    //   Utils.dispatchAndUpdateImage(
    //     dispatch,
    //     addAnnotation,
    //     {
    //       bbox,
    //       area,
    //       segmentation: [],
    //     }
    //   );
    //   // show edit label when annotation is added
    //   event.stopPropagation();
    //   dispatch(updateAnnotationContextVisibility(true));
    //   setTimeout(
    //     () => dispatch(updateEditLabelVisibility(true)),
    //     0
    //   );
    // }
    // Utils.resetCornerstoneTools(viewportRef.current);
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
    detections: Detection[],
    zoom = 1,
  ): void {
    // TODO: get the actual selected detection
    const SELECTED_DETECTION = this.detectionsService.getSelectedDetection();
    // TODO: get the actual selected category
    const SELECTED_CATEGORY = '';
    // TODO: get the actual edition mode
    const CURRENT_EDITION_MODE = EditionMode.NoTool;

    const { BORDER_WIDTH, FONT_DETAILS } = DETECTION_STYLE;
    context.font = FONT_DETAILS.get(zoom);
    context.lineWidth = BORDER_WIDTH / zoom;

    detections.forEach((detection) => {
      if (
        !detection.visible ||
        (detection.selected && CURRENT_EDITION_MODE !== EditionMode.NoTool)
      ) {
        return;
      }

      const renderColor = this.getDetectionRenderColor(
        detection,
        SELECTED_CATEGORY,
        SELECTED_DETECTION,
      );
      context.strokeStyle = renderColor;
      context.fillStyle = renderColor;

      const [x, y, w, h] = detection.boundingBox;

      context.strokeRect(x, y, w, h);

      context.globalAlpha = 0.5;
      if ('polygonMask' in detection && detection.polygonMask.length) {
        renderPolygonMasks(context, detection.polygonMask);
      } else if (detection.binaryMask) {
        renderBinaryMasks(detection.binaryMask, context, zoom);
      }

      context.globalAlpha = 1.0;

      this.renderDetectionLabel(context, detection, zoom);
    });
  }

  /**
   * Draws the detection label with the font size based on the zoom level
   */
  private renderDetectionLabel(
    context: CanvasRenderingContext2D,
    detection: Detection,
    zoom: number,
  ) {
    const labelText = limitCharCount(detection.className);
    const { LABEL_PADDING, LABEL_HEIGHT } = DETECTION_STYLE;
    const { width, height } = getTextLabelSize(
      context,
      labelText,
      LABEL_PADDING.LEFT,
      zoom,
      LABEL_HEIGHT,
    );

    const [x, y] = detection.boundingBox;
    context.fillRect(x - context.lineWidth / 2, y - height, width, height);
    context.fillStyle = DETECTION_STYLE.LABEL_TEXT_COLOR;
    context.fillText(
      labelText,
      x + (LABEL_PADDING.LEFT - 1) / zoom,
      y - LABEL_PADDING.BOTTOM / zoom,
    );
  }

  /**
   * Returns the detection color based on whether it's selected, or another detection is selected
   */
  private getDetectionRenderColor(
    detection: Detection,
    selectedCategory: string,
    selectedDetection: Detection | null,
  ): string {
    let renderColor = detection.color;
    if (detection.selected || detection.categorySelected) {
      renderColor = DETECTION_STYLE.SELECTED_COLOR;
    }
    if (selectedDetection !== null && selectedCategory === '') {
      if (selectedDetection?.uuid !== detection.uuid) {
        renderColor = hexToCssRgba(detection.color);
      }
    }
    if (
      selectedCategory !== '' &&
      selectedCategory !== detection.categoryName
    ) {
      renderColor = hexToCssRgba(detection.color);
    }

    return renderColor;
  }
}
