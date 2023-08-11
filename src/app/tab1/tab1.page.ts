import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import {CsCanvasComponent} from "../cs-canvas/cs-canvas.component";
import {CurrentFileService} from "../services/current-file/current-file.service";
import {CurrentFileUpdatePayload} from "../../../shared/modals/channels-payloads";

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
  constructor(private currentFileService: CurrentFileService) {
    currentFileService.getCurrentFile().subscribe((currentFile)=> {
      this.currentFile = currentFile;
    })
  }
}
