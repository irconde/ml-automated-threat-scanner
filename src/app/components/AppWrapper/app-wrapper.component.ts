import { Component } from '@angular/core';
import { FileService } from '../../services/file/file.service';
import { SettingsService } from '../../services/settings/settings.service';
import { Platforms } from '../../../enums/platforms';
import { CommonModule } from '@angular/common';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { ApplicationSettings } from '../../services/settings/models/Settings';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CsCanvasComponent } from '../cs-canvas/cs-canvas.component';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { DetectionContextMenuComponent } from '../detection-context-menu/detection-context-menu.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { LabelEditComponent } from '../label-edit/label-edit.component';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { NoFileSignComponent } from '../no-file-sign/no-file-sign.component';
import { ColorsCacheService } from '../../services/colors-cache/colors-cache.service';

@Component({
  selector: 'app-wrapper',
  templateUrl: 'app-wrapper.component.html',
  styleUrls: ['app-wrapper.component.scss'],
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
    TopBarComponent,
    DetectionContextMenuComponent,
    SideMenuComponent,
    LabelEditComponent,
    ColorPickerComponent,
    NoFileSignComponent,
  ],
})
export class AppWrapperComponent {
  // currentFile: FilePayload | null = null;
  settings: ApplicationSettings | null = null;
  public readonly Platforms: typeof Platforms = Platforms;
  public isLoading = true;

  constructor(
    public colorsService: ColorsCacheService,
    public fileService: FileService,
    public settingsService: SettingsService,
    public dialog: MatDialog,
  ) {
    this.colorsService.$isLoading.subscribe(
      (areColorsLoading) => (this.isLoading = areColorsLoading),
    );
    // fileService.getCurrentFile().subscribe((currentFile) => {
    //   this.currentFile = currentFile;
    // });

    settingsService
      .getSettings()
      .subscribe((settings: ApplicationSettings | null) => {
        this.settings = settings;
        // settings are null when they are first loading
        if (settings && SettingsService.isMissingRequiredInfo(settings)) {
          this.openSettingsModal();
        }
      });
  }

  openSettingsModal() {
    this.dialog.open(SettingsModalComponent, {
      autoFocus: false,
    });
  }
}
