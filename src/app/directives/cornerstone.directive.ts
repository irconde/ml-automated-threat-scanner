import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import {cornerstone, cornerstoneTools} from '../csSetup';

@Directive({
  selector: '[csDirective]',
  standalone: true,
})
export class CornerstoneDirective implements OnInit, AfterViewInit {
  element: HTMLElement;
  currentIndex = 0;

  @Input()
  set image(imageData: cornerstone.Image | null) {
    if (!imageData?.imageId) return;

    cornerstone.enable(this.element);
    this.displayImage(imageData);
  }

  constructor(public elementRef: ElementRef) {
    this.element = elementRef.nativeElement;
  }

  @HostListener('mousewheel', ['$event'])
  onMouseWheel(event: {
    wheelDelta: number;
    detail: string;
    preventDefault: ()=>void;
  }) {
    console.log('mouseWheel');
  }

  ngOnInit() {}

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
  }

  displayImage(image: cornerstone.Image) {
    cornerstone.displayImage(this.element, image);
  }
}
