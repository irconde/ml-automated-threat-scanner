import { Component, Input } from '@angular/core';

@Component({
  selector: 'app-color-svg',
  templateUrl: './color-svg.component.html',
  styleUrls: ['./color-svg.component.scss'],
  standalone: true,
})
export class ColorComponent {
  @Input() color: string = '#ffffff';

  constructor() {}
}
