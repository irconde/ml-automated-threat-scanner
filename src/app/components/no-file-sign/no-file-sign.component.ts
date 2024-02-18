import { Component } from '@angular/core';
import { UiService } from '../../services/ui/ui.service';
import { ImageStatus } from '../../services/ui/model/enum';
import { SettingsService } from '../../services/settings/settings.service';
import { WorkingMode } from '../../../enums/platforms';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-no-file-sign',
  templateUrl: './no-file-sign.component.html',
  styleUrls: ['./no-file-sign.component.scss'],
  standalone: true,
  imports: [NgIf],
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
          appSettings.workingMode === WorkingMode.RemoteServer
            ? 'No file available'
            : 'Please select a file';
      }
    });
  }
}
