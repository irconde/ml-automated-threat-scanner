import { Component, OnInit } from '@angular/core';
import { SettingsService } from '../services/settings/settings.service';
import { FileService } from '../services/file/file.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import {
  MatSlideToggleChange,
  MatSlideToggleModule,
} from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import {
  MatCheckboxChange,
  MatCheckboxModule,
} from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectChange, MatSelectModule } from '@angular/material/select';
import { NgForOf } from '@angular/common';
import { WorkingMode } from '../../enums/platforms';

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
  ],
})
export class SettingsModalComponent implements OnInit {
  isRemoteService: boolean = true;
  autoconnectChecked: boolean = true;
  hostValue: string = '';
  portValue: string = '';
  workingDirectory: string = '';

  constructor(
    private settingsService: SettingsService,
    private fileService: FileService,
  ) {}

  output_options: OutputOptions[] = [
    { value: '0', viewValue: 'ORA' },
    { value: '1', viewValue: 'ZIP' },
  ];
  annotation_options: AnnotationOptions[] = [
    { value: '0', viewValue: 'COCO' },
    { value: '1', viewValue: 'DICOS' },
  ];

  ngOnInit() {
    // Implement initialization logic here after implementing save settings
    console.log('Settings Modal Component Initialized');
  }

  //TODO: change to electron only
  openDirectoryPicker() {
    console.log('Opening directory picker...');
  }

  setHostAndPortValues() {
    this.hostValue = this.settingsService.remoteIp || '';
    this.portValue = this.settingsService.remotePort || '';
  }

  toggleRemoteService(event: MatSlideToggleChange) {
    this.isRemoteService = event.checked;
    if (this.isRemoteService) {
      this.settingsService.workingMode = WorkingMode.RemoteServer;
    } else {
      this.settingsService.workingMode = WorkingMode.LocalDirectory;
    }
    console.log({
      isRemoteService: this.isRemoteService,
      workingMode: this.settingsService.workingMode,
    });
  }

  toggleAutoconnect(event: MatCheckboxChange) {
    this.autoconnectChecked = event.checked;
    console.log({ autoconnectChecked: this.autoconnectChecked });
  }

  checkConnection() {
    console.log('Checking connection...');
  }

  setFileFormat(event: MatSelectChange) {
    let selectedValue = event.value;
    selectedValue === '0' ? (selectedValue = 'ORA') : (selectedValue = 'ZIP');
    console.log({ fileFormat: selectedValue });
  }

  setAnnotationFormat(event: MatSelectChange) {
    let selectedValue = event.value;
    selectedValue === '0'
      ? (selectedValue = 'COCO')
      : (selectedValue = 'DICOS');
    console.log({ annotationFormat: selectedValue });
  }

  saveSettings() {
    console.log('Saving settings...');
  }
}
