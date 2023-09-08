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
import { DETECTION_STYLE } from '../../enums/detection-styles';

@Directive({
  selector: '[csDirective]',
  standalone: true,
})
export class CornerstoneDirective implements OnInit, AfterViewInit {
  element: HTMLElement;
  currentIndex = 0;

  constructor(public elementRef: ElementRef) {
    this.element = elementRef.nativeElement;
  }

  @Input()
  set image({ imageData, detectionData }: ViewportData) {
    if (!imageData?.imageId) return;
    console.log(detectionData);
    cornerstone.enable(this.element);
    const thing = cornerstone.getEnabledElement(this.element);
    const context = thing.canvas?.getContext('2d');
    console.log(context);
    this.displayImage(imageData);
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

    // element.addEventListener(
    //   "cornerstoneimagerendered",
    //   this.onImageRendered
    // );
    // element.addEventListener("cornerstonenewimage", this.onNewImage);
    // window.addEventListener("resize", this.onWindowResize);
  }

  displayImage(image: cornerstone.Image) {
    cornerstone.displayImage(this.element, image);
  }

  private renderAnnotations(
    context: CanvasRenderingContext2D,
    detections: Detection[],
  ): void {
    // TODO: get the actual zoom level
    const ZOOM = 1;
    // TODO: get the actual selected detection
    const SELECTED_DETECTION = detections[0];
    // TODO: get the actual selected category
    const SELECTED_CATEGORY = 'hello world';

    const { LABEL_PADDING, BORDER_WIDTH, LABEL_HEIGHT } = DETECTION_STYLE;
    context.font = DETECTION_STYLE.FONT_DETAILS.get(ZOOM);
    context.lineWidth = BORDER_WIDTH / ZOOM;

    for (let j = 0; j < detections.length; j++) {
      if (
        !detections[j].visible ||
        (detections[j].selected &&
          editionModeRef.current !== constants.editionMode.NO_TOOL)
      )
        continue;
      let renderColor = detections[j].color;
      if (detections[j].selected || detections[j].categorySelected) {
        renderColor = DETECTION_STYLE.SELECTED_COLOR;
      }
      if (SELECTED_DETECTION !== null && SELECTED_CATEGORY === '') {
        if (SELECTED_DETECTION.id !== detections[j].id) {
          const rgb = Utils.hexToRgb(detections[j].color);
          renderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
        }
      }
      if (
        SELECTED_CATEGORY !== '' &&
        SELECTED_CATEGORY !== detections[j].categoryName
      ) {
        const rgb = Utils.hexToRgb(detections[j].color);
        renderColor = `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, 0.25)`;
      }
      context.strokeStyle = renderColor;
      context.fillStyle = renderColor;

      const [x, y, w, h] = detections[j].bbox;

      context.strokeRect(x, y, w, h);

      context.globalAlpha = 0.5;
      if (detections[j].segmentation.length > 0) {
        if (detections[j].iscrowd === 0) {
          detections[j].segmentation.forEach((segment) => {
            // Utils.renderPolygonMasks(context, segment);
          });
        }
      } else if (detections[j].iscrowd === 1) {
        // Utils.renderRLEMask(context, detections[j].segmentation);
      }

      context.globalAlpha = 1.0;

      // Label rendering
      const labelText = Utils.limitCharCount(detections[j].categoryName);
      const { width, height } = Utils.getTextLabelSize(
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
