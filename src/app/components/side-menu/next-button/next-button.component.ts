import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { SettingsService } from '../../../services/settings/settings.service';
import { WorkingMode } from '../../../../enums/platforms';

@Component({
  selector: 'app-next-button',
  templateUrl: './next-button.component.html',
  styleUrls: ['./next-button.component.scss'],
  standalone: true,
  imports: [MatButtonModule],
})
export class NextButtonComponent {
  protected displayString: string = 'Next';

  constructor(private settingsService: SettingsService) {
    this.settingsService.getSettings().subscribe((appSettings) => {
      if (appSettings !== null) {
        this.displayString =
          appSettings.workingMode !== WorkingMode.IndividualFile
            ? 'Next'
            : 'Save';
      }
    });
  }
}
