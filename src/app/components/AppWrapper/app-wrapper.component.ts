import { Component } from '@angular/core';
import { FilePayload } from '../../../../shared/models/file-models';
import { FileService } from '../../services/file/file.service';
import { Platforms } from '../../../enums/platforms';
import { CommonModule } from '@angular/common';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { IonicModule } from '@ionic/angular';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { CsCanvasComponent } from '../cs-canvas/cs-canvas.component';
import { TopBarComponent } from '../top-bar/top-bar.component';
import { DetectionContextMenuComponent } from '../detection-context-menu/detection-context-menu.component';
import { SideMenuComponent } from '../side-menu/side-menu.component';
import { LabelEditComponent } from '../label-edit/label-edit.component';
import { ColorPickerComponent } from '../color-picker/color-picker.component';
import { NoFileSignComponent } from '../no-file-sign/no-file-sign.component';
import { AuthService } from '../../services/auth/auth.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';
import { SettingsService } from '../../services/settings/settings.service';

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
    AuthModalComponent,
  ],
})
export class AppWrapperComponent {
  currentFile: FilePayload | null = null;
  public readonly Platforms: typeof Platforms = Platforms;
  protected isAuthLoading = true;

  constructor(
    public fileService: FileService,
    public dialog: MatDialog,
    private authService: AuthService,
    private settingsService: SettingsService,
  ) {
    fileService.getCurrentFile().subscribe((currentFile) => {
      this.currentFile = currentFile;
    });

    // Show app when auth is finished loading
    const authSub = authService.$isLoading.subscribe((isLoading) => {
      if (isLoading) return;
      this.isAuthLoading = isLoading;
      authSub.unsubscribe();
    });

    // Show auth modal on first launch
    const settingsSub = settingsService.getSettings().subscribe((settings) => {
      if (!settings) return;
      const { isFirstLaunch, ...otherSettings } = settings;
      if (isFirstLaunch) {
        this.dialog.open(AuthModalComponent);
        settingsService.update(otherSettings).then();
      }
      settingsSub.unsubscribe();
    });
  }
}
