import { Component } from '@angular/core';

@Component({
  selector: 'app-color-svg',
  templateUrl: './color-svg.component.html',
  styles: [
    `
      svg {
        width: 24px;
        aspect-ratio: 1;
      }
    `,
    `
      .coloredTag {
        stroke: #464646;
        stroke-width: 3;
        fill: #808080;
      }
    `,
  ],
  standalone: true,
})
export class ColorComponent {
  constructor() {}
}
