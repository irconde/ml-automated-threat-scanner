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
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';

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
    MatIconModule,
    MatButtonModule,
    MatDialogModule,
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
    public dialog: MatDialog,
  ) {
    fileService.getCurrentFile().subscribe((currentFile) => {
      this.currentFile = currentFile;
    });
    settingsService.getSettings().subscribe((settings: ApplicationSettings) => {
      this.settings = settings;
    });
  }

  openSettingsModal() {
    this.dialog.open(SettingsModalComponent, {
      autoFocus: false,
    });
  }
}
