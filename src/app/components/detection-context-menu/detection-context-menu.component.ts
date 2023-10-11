import { Component } from '@angular/core';

@Component({
  selector: 'app-detection-context-menu',
  templateUrl: './detection-context-menu.component.html',
  styleUrls: ['./detection-context-menu.component.scss'],
  standalone: true,
  imports: [],
})
export class DetectionContextMenuComponent {
  color = 'blue';

  // detectionType: DetectionType;

  constructor() {}

  handleMenuItemClick(type: string) {
    switch (type) {
      case 'LABEL':
        console.log('Label Edit');
        break;
      case 'COLOR':
        console.log('Color Edit');
        break;
      case 'BOUNDING':
        console.log('Bounding Box Edit');
        break;
      case 'POLYGON':
        console.log('Polygon Mask Edit');
        break;
      case 'MOVE':
        console.log('Move');
        break;
      case 'DELETE':
        console.log('Delete');
        break;
      default:
        break;
    }
  }
}
