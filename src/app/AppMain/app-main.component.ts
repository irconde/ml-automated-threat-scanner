import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CsCanvasComponent } from '../cs-canvas/cs-canvas.component';
import { FilePayload } from '../../../shared/models/file-models';
import { FileService } from '../services/file/file.service';
import { SettingsService } from '../services/settings/settings.service';
import { FileAndDetectionSettings } from '../../../electron/models/Settings';
import { Platforms } from '../../enums/platforms';
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
  currentFile: FilePayload | null = null;

  settings: FileAndDetectionSettings | null = null;
  public readonly Platforms: typeof Platforms = Platforms;

  constructor(
    public fileService: FileService,
    public settingsService: SettingsService,
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
}