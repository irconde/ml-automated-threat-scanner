import { Component } from '@angular/core';
import { UiService } from '../../services/ui/ui.service';
import { ImageStatus } from '../../services/ui/model/enum';
import { SettingsService } from '../../services/settings/settings.service';
import { WorkingMode } from '../../../enums/platforms';
import { NgIf, NgOptimizedImage } from '@angular/common';

@Component({
  selector: 'app-no-file-sign',
  templateUrl: './no-file-sign.component.html',
  styleUrls: ['./no-file-sign.component.scss'],
  standalone: true,
  imports: [NgIf, NgOptimizedImage],
})
export class NoFileSignComponent {
  protected isVisible: boolean = false;
  protected displayString: string = 'No file available';

  constructor(
    private uiService: UiService,
    private settingsService: SettingsService,
  ) {
    this.uiService.getImageStatus().subscribe((status) => {
      this.isVisible = status === ImageStatus.NoImage;
    });

    this.settingsService.getSettings().subscribe((appSettings) => {
      if (appSettings !== null) {
        this.displayString =
          appSettings.workingMode === WorkingMode.MinIO
            ? 'No file available'
            : 'Select a file';
      }
    });
  }
}
