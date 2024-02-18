import { Component } from '@angular/core';
import { SettingsService } from '../../services/settings/settings.service';
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
import { NgForOf, NgIf } from '@angular/common';
import { FileFormat, Platforms, WorkingMode } from '../../../enums/platforms';
import { DetectionType } from '../../../models/detection';
import { getElectronAPI } from '../../get-electron-api';
import { Channels } from '../../../../shared/constants/channels';
import { MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import {
  ApplicationSettings,
  DEFAULT_SETTINGS,
} from '../../services/settings/models/Settings';
import { IonicModule } from '@ionic/angular';

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
    MatDialogModule,
    NgIf,
    IonicModule,
  ],
})
export class SettingsModalComponent {
  submitting: boolean = false;
  settings: ApplicationSettings | null = null;
  form: FormGroup<Record<keyof ApplicationSettings, FormControl>>;
  public readonly shouldAllowImageDir: boolean;
  public disableClose: boolean = true;
  output_options: OutputOptions[] = [
    { value: FileFormat.OpenRaster, viewValue: 'ORA' },
    { value: FileFormat.ZipArchive, viewValue: 'ZIP' },
  ];
  annotation_options: AnnotationOptions[] = [
    { value: DetectionType.COCO, viewValue: 'COCO' },
    { value: DetectionType.TDR, viewValue: 'DICOS' },
  ];

  constructor(
    public dialogRef: MatDialogRef<SettingsModalComponent>,
    private settingsService: SettingsService,
  ) {
    this.form = this.getFormGroup();
    this.shouldAllowImageDir =
      this.settingsService.platform === Platforms.Electron;
    this.dialogRef.disableClose = this.disableClose;
    settingsService.getSettings().subscribe((settings) => {
      this.settings = settings;
      if (settings) {
        this.setFormValues(settings);
        this.disableClose = SettingsService.isMissingRequiredInfo(settings);
        this.dialogRef.disableClose = this.disableClose;
      }
    });
  }

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
    const isDirectory = this.form.get('selectedImagesDirPath')?.value;
    if (!isRemote) {
      if (isDirectory === null || isDirectory === '') {
        workingMode = WorkingMode.IndividualFile;
      } else {
        workingMode = WorkingMode.LocalDirectory;
      }
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
    this.settingsService
      .update(formSettings)
      .then(() => {
        if (!SettingsService.isMissingRequiredInfo(formSettings)) {
          this.dialogRef.close();
        }
      })
      .finally(() => {
        this.submitting = false;
      });
  }

  private setFormValues(settings: ApplicationSettings) {
    Object.keys(settings).forEach((key) => {
      const value = this.getFormControlValue(
        key as keyof ApplicationSettings,
        settings,
      );
      this.form.get(key)?.setValue(value);
    });
  }

  private getFormControlValue(
    key: keyof ApplicationSettings,
    settings: ApplicationSettings,
  ) {
    let value = settings[key as keyof ApplicationSettings];
    if (key === 'workingMode') {
      value = value === WorkingMode.RemoteServer;
    }
    return value;
  }

  private getFormGroup() {
    return new FormGroup(
      Object.keys(DEFAULT_SETTINGS).reduce<Record<string, FormControl>>(
        (acc, key: string) => {
          const value = this.getFormControlValue(
            key as keyof ApplicationSettings,
            DEFAULT_SETTINGS,
          );
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
}
