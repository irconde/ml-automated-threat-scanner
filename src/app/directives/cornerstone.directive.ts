import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
} from '@angular/core';
import { cornerstone } from '../csSetup';
import { ViewportData } from '../../models/viewport';
import { Detection } from '../../models/detection';
import { DETECTION_STYLE, EDITION_MODE } from '../../enums/detection-styles';
import {
  getTextLabelSize,
  hexToCssRgba,
  limitCharCount,
} from '../utilities/text.utilities';
import {renderBinaryMasks} from "../utilities/detection.utilities";

@Directive({
  selector: '[csDirective]',
  standalone: true,
})
export class CornerstoneDirective implements AfterViewInit {
  element: HTMLElement;
  currentIndex = 0;
  private readonly CS_EVENT = {
    RENDER: 'cornerstoneimagerendered',
  };

  constructor(public elementRef: ElementRef) {
    this.element = elementRef.nativeElement;
  }

  @Input()
  set image({ imageData, detectionData }: ViewportData) {
    if (!imageData?.imageId) return;
    cornerstone.enable(this.element);
    const enabledElement = cornerstone.getEnabledElement(this.element);
    const context = enabledElement.canvas?.getContext('2d');
    this.displayImage(imageData);
    if (context) {
      const handleImageRender = (event: any) => {
        this.renderDetections(
          context,
          detectionData,
          enabledElement.viewport?.scale,
        );
        this.element.removeEventListener(
          this.CS_EVENT.RENDER,
          handleImageRender,
        );
      };
      this.element.addEventListener(this.CS_EVENT.RENDER, handleImageRender);
    }
  }

  @HostListener('mousewheel', ['$event'])
  onMouseWheel() {
    console.log('mouseWheel');
  }

  ngAfterViewInit() {
    // Enable the element with Cornerstone
    cornerstone.enable(this.element);

    // // following code won't work on mobile. It's causing the buttons to stop working

    // cornerstoneTools.mouseInput.enable(this.element);
    // cornerstoneTools.mouseWheelInput.enable(this.element);
    // cornerstoneTools.wwwc.activate(this.element, 1); // ww/wc is the default tool for left mouse button
    // cornerstoneTools.pan.activate(this.element, 2); // pan is the default tool for middle mouse button
    // cornerstoneTools.zoom.activate(this.element, 4); // zoom is the default tool for right mouse button
    // cornerstoneTools.zoomWheel.activate(this.element); // zoom is the default tool for middle mouse wheel
    //
    // cornerstoneTools.touchInput.enable(this.element);
    // cornerstoneTools.panTouchDrag.activate(this.element);
    // cornerstoneTools.zoomTouchPinch.activate(this.element);

    // this.element.addEventListener('cornerstoneimagerendered', () => {});
    // element.addEventListener("cornerstonenewimage", this.onNewImage);
    // window.addEventListener("resize", this.onWindowResize);
  }

  displayImage(image: cornerstone.Image) {
    cornerstone.displayImage(this.element, image);
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
    const SELECTED_DETECTION = detections[0];
    // TODO: get the actual selected category
    const SELECTED_CATEGORY = '';
    // TODO: get the actual edition mode
    const CURRENT_EDITION_MODE = EDITION_MODE.NO_TOOL;

    const { BORDER_WIDTH, FONT_DETAILS } = DETECTION_STYLE;
    context.font = FONT_DETAILS.get(zoom);
    context.lineWidth = BORDER_WIDTH / zoom;

    detections.forEach((detection) => {
      if (
        !detection.visible ||
        (detection.selected && CURRENT_EDITION_MODE !== EDITION_MODE.NO_TOOL)
      ) {
        return;
      }

      const renderColor = this.getDetectionRenderColor(
        detection,
        SELECTED_DETECTION,
        SELECTED_CATEGORY,
      );
      context.strokeStyle = renderColor;
      context.fillStyle = renderColor;

      const [x, y, w, h] = detection.boundingBox;

      context.strokeRect(x, y, w, h);

      context.globalAlpha = 0.5;
      if (detection.binaryMask) {
        renderBinaryMasks(detection.binaryMask, context, zoom)
      }
      // if (detection.segmentation.length > 0) {
      //   if (detection.iscrowd === 0) {
          // detection.segmentation.forEach((segment) => {
          //   Utils.renderPolygonMasks(context, segment);
          // });
        // }
      // } else if (detection.iscrowd === 1) {
        // Utils.renderRLEMask(context, detection.segmentation);
      // }

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
    selectedDetection: Detection,
    selectedCategory: string,
  ): string {
    let renderColor = detection.color;
    if (detection.selected || detection.categorySelected) {
      renderColor = DETECTION_STYLE.SELECTED_COLOR;
    }
    if (selectedDetection !== null && selectedCategory === '') {
      if (selectedDetection.id !== detection.id) {
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
