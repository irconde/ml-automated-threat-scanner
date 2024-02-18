import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-save-button',
  templateUrl: './save-button.component.html',
  styleUrls: [
    '../shared-button.component.scss',
    './save-button.component.scss',
  ],
  standalone: true,
  imports: [MatButtonModule, IonicModule],
})
export class SaveButtonComponent {
  constructor() {}
}
