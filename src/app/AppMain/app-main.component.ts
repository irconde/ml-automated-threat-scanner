import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CsCanvasComponent } from '../cs-canvas/cs-canvas.component';
import { CurrentFileUpdatePayload } from '../../../shared/models/channels-payloads';
import { FileService } from '../services/file/file.service';
import { SettingsService } from '../services/settings/settings.service';
import { FileAndAnnotationSettings } from '../../../electron/models/Settings';
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
    public fileService: FileService,
    public settingsService: SettingsService
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
}
