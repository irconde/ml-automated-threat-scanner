import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import {CsCanvasComponent} from "../cs-canvas/cs-canvas.component";
import {CurrentFileUpdatePayload} from "../../../shared/models/channels-payloads";
import {FileService} from "../services/file/file.service";
import {SettingsService} from "../services/settings/settings.service";
import {FileAndAnnotationSettings} from "../../../electron/models/Settings";
import {FileParserService} from "../file-parser/file-parser.service";

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

  settings: FileAndAnnotationSettings | null = null;
  constructor(private fileService: FileService,
              private settingsService: SettingsService,
              private fileParserService: FileParserService) {
    fileService.getCurrentFile().subscribe((currentFile)=> {
      this.currentFile = currentFile;
    })
    settingsService.getSettings().subscribe((settings: FileAndAnnotationSettings) => {
      this.settings = settings;
    })
  }

  // TODO: remove this. For testing only
  async showFilePicker() {
    // @ts-ignore
    const [fileHandle] = await window.showOpenFilePicker()
    const file = await fileHandle.getFile();
    const contents = await file.arrayBuffer();
    const data = await this.fileParserService.loadData(contents);
    console.log(data);
  }
}
