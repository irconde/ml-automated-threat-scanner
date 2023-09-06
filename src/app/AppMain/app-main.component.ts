import { Component } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CsCanvasComponent } from '../cs-canvas/cs-canvas.component';
import { FilePayload } from '../../../shared/models/file-models';
import { FileService } from '../services/file/file.service';
import { SettingsService } from '../services/settings/settings.service';
import { Platforms } from '../../enums/platforms';
import { CommonModule } from '@angular/common';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApplicationSettings } from '../services/settings/models/Settings';

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
  currentFile: FilePayload | null = null;

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
    settingsService
      .getSettings()
      .subscribe((settings: ApplicationSettings | null) => {
        this.settings = settings;
      });
  }

  openSettingsModal() {
    this.dialog.open(SettingsModalComponent, {
      autoFocus: false,
    });
  }
}
