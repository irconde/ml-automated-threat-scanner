import { Component } from '@angular/core';
import { FilePayload } from '../../../../shared/models/file-models';
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
import fetch from 'cross-fetch';

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
        // settings are null when they are first loading
        if (settings && SettingsService.isMissingRequiredInfo(settings)) {
          this.openSettingsModal();
        } else if (
          settings &&
          !SettingsService.isMissingRequiredInfo(settings)
        ) {
          this.dialog.closeAll();
        }
      });
  }

  async generateToken(): Promise<string> {
    // TODO: Get from ENV
    const clientId = 'test';
    const clientSecret = 'test';

    const details = {
      scope: 'read',
      grant_type: 'client_credentials',
    };

    const formBody = Object.keys(details)
      .map(
        (key) =>
          // eslint-disable-next-line @typescript-eslint/ban-ts-comment
          // @ts-ignore
          encodeURIComponent(key) + '=' + encodeURIComponent(details[key]),
      )
      .join('&');

    const base64Credentials = btoa(`${clientId}:${clientSecret}`);

    const response = await fetch('http://localhost:8080/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: 'Basic ' + base64Credentials,
      },
      body: formBody,
    });

    if (response.status === 200) {
      const jsonBody = await response.json();
      console.log(jsonBody);
      console.log(`Token: ${jsonBody.access_token}`);
      return jsonBody.access_token as string;
    }

    return '';
  }

  async callLogin(): Promise<void> {
    const token = await this.generateToken();

    const response = await fetch('http://localhost:8080/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: 'Bearer ' + token,
      },
      body: JSON.stringify({ username: 'test', password: 'test' }),
    });

    if (response.status === 200) {
      const jsonBody = await response.json();
      console.log(jsonBody);
    }
  }

  openSettingsModal() {
    this.dialog.open(SettingsModalComponent, {
      autoFocus: false,
    });
  }
}
