import { Component } from '@angular/core';

@Component({
  selector: 'app-rectangle-svg',
  templateUrl: './rectangle-svg.component.html',
  styles: [
    `
      svg {
        width: 24px;
        aspect-ratio: 3/5;
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
export class RectangleComponent {
  constructor() {}
}
