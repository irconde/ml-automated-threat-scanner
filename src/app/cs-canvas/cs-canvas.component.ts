import {
  AfterViewChecked,
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild
} from '@angular/core';
import {cornerstone, cornerstoneTools} from '../csSetup'

const IMAGE_ID = "https://rawgit.com/cornerstonejs/cornerstoneWebImageLoader/master/examples/Renal_Cell_Carcinoma.jpg";

@Component({
  selector: 'app-cs-canvas',
  templateUrl: './cs-canvas.component.html',
  styleUrls: ['./cs-canvas.component.scss'],
  standalone: true
})
export class CsCanvasComponent implements AfterViewInit {

  // @ts-ignore
  @ViewChild('viewport') viewport: ElementRef;

  stack = {
    imageIds: [IMAGE_ID],
    currentImageIdIndex: 0,
  };
  imageId = this.stack.imageIds[0];

  constructor(private cdr : ChangeDetectorRef) {}

  ngAfterViewInit() {
    setTimeout(() => this.setUpCornerstone(), 0)
  }

  setUpCornerstone() {
    const element : HTMLElement = this.viewport.nativeElement;
    // Enable the DOM Element for use with Cornerstone
    cornerstone.enable(element);
    // Load the first image in the stack
    cornerstone.loadImage(this.imageId).then(image => {
      // Display the first image
      cornerstone.displayImage(element, image);
      // Add the stack tool state to the enabled element
      cornerstoneTools.addStackStateManager(element, ["stack"]);
      cornerstoneTools.addToolState(element, "stack", this.stack);

      cornerstoneTools.mouseInput.enable(element);
      cornerstoneTools.mouseWheelInput.enable(element);
      cornerstoneTools.wwwc.activate(element, 1); // ww/wc is the default tool for left mouse button
      cornerstoneTools.pan.activate(element, 2); // pan is the default tool for middle mouse button
      cornerstoneTools.zoom.activate(element, 4); // zoom is the default tool for right mouse button
      cornerstoneTools.zoomWheel.activate(element); // zoom is the default tool for middle mouse wheel

      cornerstoneTools.touchInput.enable(element);
      cornerstoneTools.panTouchDrag.activate(element);
      cornerstoneTools.zoomTouchPinch.activate(element);

      element.addEventListener(
        "cornerstoneimagerendered",
        this.onImageRendered
      );
      element.addEventListener("cornerstonenewimage", this.onNewImage);
      window.addEventListener("resize", this.onWindowResize);
    });
  }


  onWindowResize() {
    console.log("onWindowResize");
  }

  onImageRendered() {
    console.log("onImageRendered")
  }

  onNewImage() {
    console.log("onNewImage")
  }

}
