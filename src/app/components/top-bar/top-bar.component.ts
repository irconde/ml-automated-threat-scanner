import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FileService } from '../../services/file/file.service';
import { SettingsService } from '../../services/settings/settings.service';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { ApplicationSettings } from '../../services/settings/models/Settings';
import { FilePayload } from '../../../../shared/models/file-models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { WorkingMode } from '../../../enums/platforms';
import { NgIf, NgStyle } from '@angular/common';
import { UiService } from '../../services/ui/ui.service';
import { AuthModalComponent } from '../auth-modal/auth-modal.component';

@Component({
  selector: 'app-top-bar',
  templateUrl: './top-bar.component.html',
  styleUrls: ['./top-bar.component.scss'],
  standalone: true,
  imports: [
    SettingsModalComponent,
    MatDialogModule,
    MatIconModule,
    MatButtonModule,
    NgStyle,
    NgIf,
  ],
})
export class TopBarComponent implements OnInit {
  currentFile: FilePayload | null = null;
  settings: ApplicationSettings | null = null;
  connectionTextContent: string = '';
  cloudIconType: 'cloud' | 'cloud_off' = 'cloud_off';
  fileQueueAmount: number = 0;
  fileButtonVisibility: string = '';
  connectionDisplay: string = 'flex';

  constructor(
    private uiService: UiService,
    public fileService: FileService,
    public settingsService: SettingsService,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    setTimeout(() => {
      this.dialog.open(AuthModalComponent);
      console.log('Opened auth modal');
    }, 1000);
    this.fileService.getCurrentFile().subscribe((currentFile) => {
      this.currentFile = currentFile;
      this.updateFileQueue();
    });

    this.settingsService
      .getSettings()
      .subscribe((settings: ApplicationSettings | null) => {
        this.settings = settings;
        this.updateConnectionStatus();
        this.setConnectionText();
        this.handleFileButtonVisibility();
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

  setConnectionText() {
    // Set connection text based on working mode
    if (this.settings?.workingMode === WorkingMode.MinIO) {
      this.connectionTextContent = `https://${this.settings?.remoteIp}:${this.settings?.remotePort}`;
    } else if (this.settings?.workingMode === WorkingMode.LocalDirectory) {
      this.connectionTextContent = `${this.settings?.selectedImagesDirPath}`;
    } else {
      this.connectionTextContent = '';
    }
  }

  updateFileQueue() {
    if (this.currentFile?.filesCount) {
      this.fileQueueAmount = this.currentFile?.filesCount;
      if (this.fileQueueAmount >= 99) this.fileQueueAmount = 99;
    } else {
      this.fileQueueAmount = 0;
    }
  }

  updateConnectionStatus() {
    this.cloudIconType =
      this.settings?.workingMode === WorkingMode.MinIO ? 'cloud' : 'cloud_off';
  }

  updateTraffic() {
    // TODO: update traffic icon based on current traffic
    const tempTraffic: string = 'noTransmission';

    switch (tempTraffic) {
      case 'downloadAndUpload':
        return 'assets/traffic icons/traffic-download-upload.icon.svg';
      case 'noTransmission':
        return 'assets/traffic icons/traffic-no-transmission.icon.svg';
      case 'downloading':
        return 'assets/traffic icons/traffic-download.icon.svg';
      case 'uploading':
        return 'assets/traffic icons/traffic-upload.icon.svg';
      default:
        return null;
    }
  }

  handleFileButtonVisibility() {
    if (
      this.settings?.workingMode !== WorkingMode.MinIO &&
      this.settings?.selectedImagesDirPath === ''
    ) {
      this.fileButtonVisibility = 'visibility: visible';
      this.connectionDisplay = 'display: none';
    } else {
      this.fileButtonVisibility = 'visibility: hidden';
      this.connectionDisplay = 'display: flex';
    }
  }

  toggleSideMenu() {
    this.uiService.toggleSideMenu();
  }

  protected readonly WorkingMode = WorkingMode;
}
