import { Component } from '@angular/core';

@Component({
  selector: 'app-polygon-svg',
  templateUrl: './polygon-svg.component.html',
  styles: [
    `
      svg {
        width: 28px;
        height: 30px;
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
export class PolygonComponent {
  constructor() {}
}
