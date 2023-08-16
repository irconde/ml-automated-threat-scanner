import {
  Component,
  OnInit,
} from '@angular/core';
import {cornerstone, cornerstoneTools} from '../csSetup'
import {CornerstoneDirective} from "../directives/cornerstone.directive";
import {CornerstoneService} from "../services/cornerstone.service";
import {getElectronAPI} from "../get-electron-api";
import {Channels} from "../../../shared/constants/channels";
import {FileService} from "../services/file/file.service";
import {SettingsService} from "../services/settings/settings.service";


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
    private fileService: FileService,
    private settingsService: SettingsService) {}

  ngOnInit() {
    this.fileService.getCurrentFile().subscribe((currentFile)=> {
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
    getElectronAPI().send(Channels.NewFileUpdate, next)
  }

}
