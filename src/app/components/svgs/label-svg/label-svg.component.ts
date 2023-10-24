import { Component } from '@angular/core';

@Component({
  selector: 'app-label-svg',
  templateUrl: './label-svg.component.html',
  styles: [
    `
      svg {
        width: 30px;
        height: 31px;
      }
    `,
  ],
  standalone: true,
})
export class LabelComponent {
  constructor() {}
}
