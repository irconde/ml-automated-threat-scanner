import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CsCanvasComponent } from '../cs-canvas/cs-canvas.component';
import { CurrentLocalDirectoryPayload } from '../../../shared/models/file-models';
import { FileService } from '../services/file/file.service';
import { SettingsService } from '../services/settings/settings.service';
import { FileAndDetectionSettings } from '../../../electron/models/Settings';
import { FileParserService } from '../services/file-parser/file-parser.service';

@Component({
  selector: 'app-main',
  templateUrl: 'app-main.component.html',
  styleUrls: ['app-main.component.scss'],
  standalone: true,
  imports: [IonicModule, ExploreContainerComponent, CsCanvasComponent],
})
export class AppMain {
  currentFile: CurrentLocalDirectoryPayload = {
    fileName: '',
    filesCount: 0,
    pixelData: undefined,
  };

  settings: FileAndDetectionSettings | null = null;

  constructor(
    private fileService: FileService,
    private settingsService: SettingsService,
    private fileParserService: FileParserService
  ) {
    fileService.getCurrentFile().subscribe((currentFile) => {
      this.currentFile = currentFile;
    });
    settingsService
      .getSettings()
      .subscribe((settings: FileAndDetectionSettings) => {
        this.settings = settings;
      });
  }

  // TODO: remove this. For testing only
  async showFilePicker() {
    // @ts-ignore
    const [fileHandle] = await window.showOpenFilePicker();
    const file = await fileHandle.getFile();
    const contents = await file.arrayBuffer();
    const data = await this.fileParserService.loadData(contents);
    console.log(data);
  }
}
