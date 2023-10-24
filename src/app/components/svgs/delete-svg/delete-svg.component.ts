import { Component } from '@angular/core';

@Component({
  selector: 'app-delete-svg',
  templateUrl: './delete-svg.component.html',
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
export class DeleteComponent {
  constructor() {}
}
