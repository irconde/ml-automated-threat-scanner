import {
  Component,
  OnInit,
} from '@angular/core';
import {cornerstone, cornerstoneTools} from '../csSetup'
import {CornerstoneDirective} from "../directives/cornerstone.directive";
import {CornerstoneService} from "../services/cornerstone.service";
import {getElectronAPI} from "../get-electron-api";
import {ElectronAPI} from "../../../shared/modals/channels-payloads";
import {CurrentFileService} from "../services/current-file/current-file.service";


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

  imageData : cornerstone.Image | null = null;
  constructor(
    private csService: CornerstoneService,
    private currentFileService: CurrentFileService) {}

  ngOnInit() {
    this.currentFileService.getCurrentFile().subscribe((currentFile)=> {
      if(!currentFile.pixelData) return;
      this.csService
        .getImageData(currentFile.fileName, currentFile.pixelData)
        .subscribe((image)=> {
            this.imageData = image;
          }
        )
    })
  }


  handleChangeImage(next = true) {
    getElectronAPI().invokeNewFileUpdate(next)
  }

}
