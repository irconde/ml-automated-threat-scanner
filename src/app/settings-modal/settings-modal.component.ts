import { Component } from '@angular/core';
import { SettingsService } from '../services/settings/settings.service';
import { FileService } from '../services/file/file.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { FormsModule } from '@angular/forms';
import { MatInputModule } from '@angular/material/input';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDividerModule } from '@angular/material/divider';
import { MatSelectModule } from '@angular/material/select';
import { NgForOf } from '@angular/common';

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
export class SettingsModalComponent {
  constructor(
    private settingsService: SettingsService,
    private fileService: FileService,
  ) {}

  isRemoteService = true;
  autoconnectChecked = true;
  output_options: OutputOptions[] = [
    { value: '0', viewValue: 'ORA' },
    { value: '1', viewValue: 'ZIP' },
  ];
  annotation_options: AnnotationOptions[] = [
    { value: '0', viewValue: 'JSON' },
    { value: '1', viewValue: 'DICOS+TDR' },
  ];
}
