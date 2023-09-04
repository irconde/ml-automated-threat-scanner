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
  settings: ApplicationSettings = DEFAULT_SETTINGS;
  form: FormGroup<Record<keyof ApplicationSettings, FormControl>> =
    new FormGroup(
      Object.keys(DEFAULT_SETTINGS).reduce<Record<string, FormControl>>(
        (acc, key: string) => {
          acc[key] = new FormControl(
            DEFAULT_SETTINGS[key as keyof ApplicationSettings],
          );
          return acc;
        },
        {},
      ),
    );

  constructor(
    private settingsService: SettingsService,
    private fileService: FileService,
  ) {
    settingsService.getSettings().subscribe((settings) => {
      this.settings = settings;
    });
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
    console.log('Opening directory picker...');
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
    console.log({ formSettings });
    //this.settingsService.update(DEFAULT_SETTINGS).then();
  }
}
