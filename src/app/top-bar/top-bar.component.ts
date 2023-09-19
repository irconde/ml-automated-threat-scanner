import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { FileService } from '../services/file/file.service';
import { SettingsService } from '../services/settings/settings.service';
import { SettingsModalComponent } from '../settings-modal/settings-modal.component';
import { ApplicationSettings } from '../services/settings/models/Settings';
import { FilePayload } from '../../../shared/models/file-models';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { WorkingMode } from '../../enums/platforms';
import { NgStyle } from '@angular/common';

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
  ],
})
export class TopBarComponent implements OnInit {
  currentFile: FilePayload | null = null;
  settings: ApplicationSettings | null = null;
  cloudIconType: 'cloud' | 'cloud_off' = 'cloud_off';
  fileQueueAmount: number = 0;

  constructor(
    public fileService: FileService,
    public settingsService: SettingsService,
    public dialog: MatDialog,
  ) {}

  ngOnInit() {
    this.fileService.getCurrentFile().subscribe((currentFile) => {
      this.currentFile = currentFile;
      this.updateFileQueue();
    });

    this.settingsService
      .getSettings()
      .subscribe((settings: ApplicationSettings | null) => {
        this.settings = settings;
        this.updateConnectionStatus();
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

  // TODO: make file queue icon update number based on the currentFile.filesCount
  updateFileQueue() {
    if (this.currentFile?.filesCount) {
      this.fileQueueAmount = this.currentFile?.filesCount;
      console.log({ fileQueueAmount: this.fileQueueAmount });
      if (this.fileQueueAmount >= 99) this.fileQueueAmount = 99;
    } else {
      this.fileQueueAmount = 0;
    }
  }

  updateConnectionStatus() {
    this.cloudIconType =
      this.settings?.workingMode === WorkingMode.RemoteServer
        ? 'cloud'
        : 'cloud_off';
  }

  // updateTraffic(){
  //   // TODO: update traffic icon based on current traffic
  //   switch () {
  //       case 'downloadAndUpload':
  //           return 'assets/traffic icons/traffic-download-upload.icon.svg';
  //       case 'noTransmission':
  //           return 'assets/traffic icons/traffic-no-transmission.icon.svg';
  //       case 'downloading':
  //           return 'assets/traffic icons/traffic-download.icon.svg';
  //       case 'uploading':
  //           return 'assets/traffic icons/traffic-upload.icon.svg';
  //       default:
  //           return null;
  //   }
  // }

  toggleSideMenu() {}
}
