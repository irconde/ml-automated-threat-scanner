import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import {CsCanvasComponent} from "../cs-canvas/cs-canvas.component";
import {CurrentFileUpdatePayload} from "../../../shared/models/channels-payloads";
import {FileService} from "../services/file/file.service";

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [IonicModule, ExploreContainerComponent, CsCanvasComponent],
})
export class Tab1Page {
  currentFile: CurrentFileUpdatePayload = {
    fileName : "",
    filesCount: 0,
    pixelData: undefined,
  };
  constructor(private fileService: FileService) {
    fileService.getCurrentFile().subscribe((currentFile)=> {
      this.currentFile = currentFile;
    })
  }
}
