import { Component } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-next-button',
  templateUrl: './next-button.component.html',
  styleUrls: [
    '../shared-button.component.scss',
    './next-button.component.scss',
  ],
  standalone: true,
  imports: [MatButtonModule],
})
export class NextButtonComponent {
  constructor() {}
}
