import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CsCanvasComponent } from '../cs-canvas/cs-canvas.component';
import { CurrentFileUpdatePayload } from '../../../shared/models/channels-payloads';
import { FileService } from '../services/file/file.service';
import { SettingsService } from '../services/settings/settings.service';
import { FileAndAnnotationSettings } from '../../../electron/models/Settings';
import { FileParserService } from '../services/file-parser/file-parser.service';
import { Platforms } from '../../models/platforms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-main',
  templateUrl: 'app-main.component.html',
  styleUrls: ['app-main.component.scss'],
  standalone: true,
  imports: [
    IonicModule,
    ExploreContainerComponent,
    CsCanvasComponent,
    CommonModule,
  ],
})
export class AppMain {
  currentFile: CurrentFileUpdatePayload = {
    fileName: '',
    filesCount: 0,
    pixelData: undefined,
  };

  public readonly Platforms: typeof Platforms = Platforms;

  settings: FileAndAnnotationSettings | null = null;

  constructor(
    private fileService: FileService,
    public settingsService: SettingsService,
    private fileParserService: FileParserService
  ) {
    fileService.getCurrentFile().subscribe((currentFile) => {
      this.currentFile = currentFile;
    });
    settingsService
      .getSettings()
      .subscribe((settings: FileAndAnnotationSettings) => {
        this.settings = settings;
      });
  }

  async showFilePicker(event: Event) {
    try {
      const platform = this.settingsService.platform;
      if (platform in [Platforms.Android, Platforms.iOS]) {
        // const file = await this.chooser.getFile();
        // console.log(file);
        console.log('SHOW FILE PICKER');
      } else {
        const target = event.target as HTMLInputElement;
        if (target?.files) {
          const file = target.files[0];
          const fileName = file.name;
          const reader = new FileReader();
          reader.onload = () => {
            const pixelData = reader.result as ArrayBuffer;
            this.fileService.setCurrentFile({
              fileName,
              pixelData,
              filesCount: 1,
            });
          };
          reader.readAsArrayBuffer(file);
        }
      }
    } catch (e) {
      console.log(e);
    }
  }
}
