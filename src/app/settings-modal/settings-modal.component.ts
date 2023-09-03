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
  ],
})
export class SettingsModalComponent {
  constructor(
    private settingsService: SettingsService,
    private fileService: FileService,
  ) {}

  isChecked = true;
}
