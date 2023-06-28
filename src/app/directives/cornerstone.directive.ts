import {Directive, ElementRef, HostListener, Input, OnInit} from '@angular/core';
import {cornerstone} from "../csSetup";

@Directive({
  selector: '.viewportElement',
  standalone: true,
})
export class CornerstoneDirective  implements OnInit {

  element:  any;
  imageList: cornerstone.Image[] = [];
  currentIndex = 0;

  @Input('image')
  set image(imageData: cornerstone.Image) {

    if (imageData) {
      console.log(imageData);
      if (!this.imageList.filter(img => img.imageId === imageData.imageId).length) {
        this.imageList.push(imageData);
      }
      if (imageData.imageId) {
        this.displayImage(imageData);
      }
    }
  }

  constructor(public elementRef: ElementRef) {
    this.elementRef = elementRef;
    console.log(elementRef.nativeElement)
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: Event) {
    cornerstone.resize(this.element, true);
  }

  @HostListener('mousewheel', ['$event'])
  onMouseWheel(event : {wheelDelta: number, detail: string, preventDefault: Function}) {

    event.preventDefault();

    const delta = Math.max(-1, Math.min(1, (event.wheelDelta || -event.detail)));

    if(delta > 0){
      this.currentIndex ++;
      if( this.currentIndex > this.imageList.length) {
        this.currentIndex = this.imageList.length-1;
      }
    } else {
      this.currentIndex --;
      if(this.currentIndex < 0){
        this.currentIndex = 0;
      }
    }

    this.image = this.imageList
      .filter( img => img.imageId === `wadouri:http://localhost:4200/assets/dicom/im${this.currentIndex}`)[0];


  }

  ngOnInit() {
    // Retrieve the DOM element itself
    this.element = this.elementRef.nativeElement;
    // Enable the element with Cornerstone
    cornerstone.enable(this.element);
  }

  displayImage(image: cornerstone.Image) {
    cornerstone.displayImage(this.element, image);
  }

}
