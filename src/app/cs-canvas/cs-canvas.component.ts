import {Component, OnInit,} from '@angular/core';
import {cornerstone} from '../csSetup'
import {CornerstoneDirective} from "../directives/cornerstone.directive";
import {CornerstoneService} from "../services/cornerstone.service";

const IMAGE_IDS = [
  "https://rawgit.com/cornerstonejs/cornerstoneWebImageLoader/master/examples/Renal_Cell_Carcinoma.jpg",
  "https://images.unsplash.com/photo-1533450718592-29d45635f0a9?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8anBnfGVufDB8fDB8fHww&w=1000&q=80",
  "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3a/Cat03.jpg/1025px-Cat03.jpg"
]

@Component({
  selector: 'app-cs-canvas',
  templateUrl: './cs-canvas.component.html',
  styleUrls: ['./cs-canvas.component.scss'],
  standalone: true,
  imports: [
    CornerstoneDirective
  ],
})
export class CsCanvasComponent implements OnInit {

  stack = {
    imageIds: IMAGE_IDS,
    currentImageIdIndex: 0,
  };

  imageData : cornerstone.Image | null = null;

  constructor(private csService: CornerstoneService) {}

  ngOnInit() {
    this.updateImage()
  }

  updateImage(){
    const currentImageId = this.stack.imageIds[this.stack.currentImageIdIndex]
    const imageObs = this.csService.fetchImage(currentImageId)
    imageObs.subscribe((image : cornerstone.Image) => {
      this.imageData = image;
    })
  }

  handleChangeImage(next = true) {
    if(next && this.stack.currentImageIdIndex + 1 < this.stack.imageIds.length) {
      this.stack.currentImageIdIndex++;
      this.updateImage()
    } else if(!next && this.stack.currentImageIdIndex > 0) {
      this.stack.currentImageIdIndex--;
      this.updateImage()
    }
  }

}
