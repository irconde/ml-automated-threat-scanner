import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DetectionsService } from '../../services/detections/detections.service';

@Component({
  selector: 'app-algorithm-info',
  templateUrl: './algorithm-info.component.html',
  styleUrls: ['./algorithm-info.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class AlgorithmInfoComponent {
  constructor(private detectionsService: DetectionsService) {}

  get algorithm() {
    return '';
  }
}
