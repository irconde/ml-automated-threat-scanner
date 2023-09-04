import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CsCanvasComponent } from '../cs-canvas/cs-canvas.component';
import { CurrentLocalDirectoryPayload } from '../../../shared/models/file-models';
import { FileService } from '../services/file/file.service';
import { SettingsService } from '../services/settings/settings.service';
import { Platforms } from '../../enums/platforms';
import { CommonModule } from '@angular/common';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { ApplicationSettings } from '../../../electron/models/Settings';

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
    SettingsModalComponent,
  ],
})
export class AppMain {
  currentFile: CurrentLocalDirectoryPayload = {
    fileName: '',
    filesCount: 0,
    pixelData: undefined,
  };

  settings: ApplicationSettings | null = null;
  public readonly Platforms: typeof Platforms = Platforms;

  constructor(
    public fileService: FileService,
    public settingsService: SettingsService,
  ) {
    fileService.getCurrentFile().subscribe((currentFile) => {
      this.currentFile = currentFile;
    });
    settingsService.getSettings().subscribe((settings: ApplicationSettings) => {
      this.settings = settings;
    });
  }
}
