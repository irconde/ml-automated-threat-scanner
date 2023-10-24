import { Component } from '@angular/core';

@Component({
  selector: 'app-movement-svg',
  templateUrl: './movement-svg.component.html',
  styles: [
    `
      svg {
        width: 32px;
        aspect-ratio: 1;
      }
    `,
  ],
  standalone: true,
})
export class MovementComponent {
  constructor() {}
}
