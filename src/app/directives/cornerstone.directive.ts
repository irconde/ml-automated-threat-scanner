import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
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

@Directive({
  selector: '[csDirective]',
  standalone: true,
})
export class CornerstoneDirective implements OnInit, AfterViewInit {
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
      this.element.addEventListener(this.CS_EVENT.RENDER, () =>
        this.renderDetections(context, detectionData),
      );
    }
  }

  @HostListener('mousewheel', ['$event'])
  onMouseWheel(event: {
    wheelDelta: number;
    detail: string;
    preventDefault: Function;
  }) {
    console.log('mouseWheel');
  }

  ngOnInit() {}

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

  private handleImageRender() {}

  private renderDetections(
    context: CanvasRenderingContext2D,
    detections: Detection[],
  ): void {
    console.log('renderDetections', detections);
    // TODO: get the actual zoom level
    const ZOOM = 1;
    // TODO: get the actual selected detection
    const SELECTED_DETECTION = detections[0];
    // TODO: get the actual selected category
    const SELECTED_CATEGORY = '';
    // TODO: get the actual edition mode
    const CURRENT_EDITION_MODE = EDITION_MODE.NO_TOOL;

    const { LABEL_PADDING, BORDER_WIDTH, LABEL_HEIGHT } = DETECTION_STYLE;
    context.font = DETECTION_STYLE.FONT_DETAILS.get(ZOOM);
    context.lineWidth = BORDER_WIDTH / ZOOM;

    for (let j = 0; j < detections.length; j++) {
      if (
        !detections[j].visible ||
        (detections[j].selected &&
          CURRENT_EDITION_MODE !== EDITION_MODE.NO_TOOL)
      )
        continue;
      let renderColor = detections[j].color;
      if (detections[j].selected || detections[j].categorySelected) {
        renderColor = DETECTION_STYLE.SELECTED_COLOR;
      }
      if (SELECTED_DETECTION !== null && SELECTED_CATEGORY === '') {
        if (SELECTED_DETECTION.id !== detections[j].id) {
          renderColor = hexToCssRgba(detections[j].color);
        }
      }
      if (
        SELECTED_CATEGORY !== '' &&
        SELECTED_CATEGORY !== detections[j].categoryName
      ) {
        renderColor = hexToCssRgba(detections[j].color);
      }
      context.strokeStyle = renderColor;
      context.fillStyle = renderColor;

      const [x, y, w, h] = detections[j].boundingBox;

      context.strokeRect(x, y, w, h);

      context.globalAlpha = 0.5;
      // if (detections[j].segmentation.length > 0) {
      //   if (detections[j].isCrowd === 0) {
      //     detections[j].segmentation.forEach((segment) => {
      //       // Utils.renderPolygonMasks(context, segment);
      //     });
      //   }
      // } else if (detections[j].isCrowd === 1) {
      //   // Utils.renderRLEMask(context, detections[j].segmentation);
      // }

      context.globalAlpha = 1.0;

      // Label rendering
      const labelText = limitCharCount(detections[j].categoryName);
      const { width, height } = getTextLabelSize(
        context,
        labelText,
        LABEL_PADDING.LEFT,
        ZOOM,
        LABEL_HEIGHT,
      );

      context.fillRect(x - context.lineWidth / 2, y - height, width, height);
      context.fillStyle = DETECTION_STYLE.LABEL_TEXT_COLOR;
      context.fillText(
        labelText,
        x + (LABEL_PADDING.LEFT - 1) / ZOOM,
        y - LABEL_PADDING.BOTTOM / ZOOM,
      );
    }
  }
}
