import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-algorithm-info',
  templateUrl: './algorithm-info.component.html',
  styleUrls: ['./algorithm-info.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class AlgorithmInfoComponent {
  constructor() {}
}
