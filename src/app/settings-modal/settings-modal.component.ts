import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings/settings.service';
import { FileService } from '../services/file/file.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { NgForOf } from '@angular/common';
import {
  ApplicationSettings,
  DEFAULT_SETTINGS,
} from '../../../electron/models/Settings';
import { FileFormat, WorkingMode } from '../../enums/platforms';
import { DetectionType } from '../../models/detection';
import { getElectronAPI } from '../get-electron-api';
import { Channels } from '../../../shared/constants/channels';

interface OutputOptions {
  value: string;
  viewValue: string;
}

interface AnnotationOptions {
  value: string;
  viewValue: string;
}

@Component({
  selector: 'app-settings-modal',
  templateUrl: './settings-modal.component.html',
  styleUrls: ['./settings-modal.component.scss'],
  standalone: true,
  imports: [
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatSlideToggleModule,
    FormsModule,
    MatInputModule,
    MatCheckboxModule,
    MatDividerModule,
    MatSelectModule,
    NgForOf,
    ReactiveFormsModule,
  ],
})
export class SettingsModalComponent implements OnInit {
  submitting: boolean = false;
  settings: ApplicationSettings = DEFAULT_SETTINGS;
  form: FormGroup<Record<keyof ApplicationSettings, FormControl>>;

  constructor(
    private settingsService: SettingsService,
    private fileService: FileService,
  ) {
    console.log('form created');
    this.form = this.getFormGroup();
    settingsService.getSettings().subscribe((settings) => {
      console.log('settings received');
      console.log({ settings });
      this.settings = settings;
      this.form = this.getFormGroup();
    });
  }

  private getFormGroup() {
    return new FormGroup(
      Object.keys(this.settings).reduce<Record<string, FormControl>>(
        (acc, key: string) => {
          let value = this.settings[key as keyof ApplicationSettings];
          if (key === 'workingMode') {
            value = value === WorkingMode.RemoteServer;
          }
          acc[key] = new FormControl({
            value,
            disabled: key === 'selectedImagesDirPath',
          });
          return acc;
        },
        {},
      ),
    );
  }

  output_options: OutputOptions[] = [
    { value: FileFormat.OpenRaster, viewValue: 'ORA' },
    { value: FileFormat.ZipArchive, viewValue: 'ZIP' },
  ];
  annotation_options: AnnotationOptions[] = [
    { value: DetectionType.COCO, viewValue: 'COCO' },
    { value: DetectionType.TDR, viewValue: 'DICOS' },
  ];

  ngOnInit() {
    // Implement initialization logic here after implementing save settings
    console.log('Settings Modal Component Initialized');
  }

  //TODO: change to electron only
  openDirectoryPicker() {
    getElectronAPI().invoke(Channels.FolderPickerInvoke, null, ({ path }) => {
      // don't update the form if cancelled
      if (!path) return;
      this.form.patchValue({ selectedImagesDirPath: path });
    });
  }

  checkConnection() {}

  saveSettings() {
    let workingMode: WorkingMode = WorkingMode.RemoteServer;
    const isRemote = this.form.get('workingMode')?.value;
    if (!isRemote) {
      workingMode = WorkingMode.LocalDirectory;
    }

    const formSettings: ApplicationSettings = {
      workingMode,
      remoteIp: this.form.get('remoteIp')?.value,
      remotePort: this.form.get('remotePort')?.value,
      fileFormat: this.form.get('fileFormat')?.value as FileFormat,
      detectionFormat: this.form.get('detectionFormat')?.value as DetectionType,
      fileNameSuffix: this.form.get('fileNameSuffix')?.value,
      autoConnect: this.form.get('autoConnect')?.value,
      selectedImagesDirPath: this.form.get('selectedImagesDirPath')?.value,
    };

    this.submitting = true;
    this.settingsService.update(formSettings).finally(() => {
      this.submitting = false;
    });
  }
}
