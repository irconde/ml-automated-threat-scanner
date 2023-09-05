import {
  AfterViewInit,
  Directive,
  ElementRef,
  HostListener,
  Input,
  OnInit,
} from '@angular/core';
import { cornerstone } from '../csSetup';

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
}
