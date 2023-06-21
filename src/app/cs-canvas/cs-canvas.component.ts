import {
  AfterViewInit,
  Component,
  ElementRef,
  ViewChild
} from '@angular/core';
import {cornerstone, cornerstoneTools} from '../csSetup'

const IMAGE_IDS = [
  "https://rawgit.com/cornerstonejs/cornerstoneWebImageLoader/master/examples/Renal_Cell_Carcinoma.jpg",
  "https://images.unsplash.com/photo-1533450718592-29d45635f0a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8anBnfGVufDB8fDB8fHww&w=1000&q=80",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1025px-Cat03.jpg"
]

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
    imageIds: IMAGE_IDS,
    currentImageIdIndex: 0,
  };

  constructor() {}

  ngAfterViewInit() {
    setTimeout(() => this.setUpCornerstone(), 0)
  }

  handleChangeImage(next = true) {
    if(next && this.stack.currentImageIdIndex + 1 < this.stack.imageIds.length) {
      this.stack.currentImageIdIndex++;
      this.setUpCornerstone()
    } else if(!next && this.stack.currentImageIdIndex > 0) {
      this.stack.currentImageIdIndex--;
      this.setUpCornerstone()
    }
  }

  renderCurrentImage() {
    // Load the first image in the stack
    cornerstone.loadImage(this.stack.imageIds[this.stack.currentImageIdIndex])
      .then(image => {
      // Display the first image
      cornerstone.displayImage(this.viewport.nativeElement, image);
    })
      .catch((e)=>{
      console.log(e)
    })
  }

  setUpCornerstone() {
    const element : HTMLElement = this.viewport.nativeElement;
    // Enable the DOM Element for use with Cornerstone
    cornerstone.enable(element);
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
    this.renderCurrentImage()

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
