import { Component } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DetectionsService } from '../../services/detections/detections.service';
import { DetectionAlgorithm } from '../../../models/detection';
import { NgIf } from '@angular/common';

@Component({
  selector: 'app-algorithm-info',
  templateUrl: './algorithm-info.component.html',
  styleUrls: ['./algorithm-info.component.scss'],
  standalone: true,
  imports: [MatIconModule, NgIf],
})
export class AlgorithmInfoComponent {
  public algorithm: DetectionAlgorithm | null = null;

  constructor(private detectionsService: DetectionsService) {
    this.detectionsService.getSelectedAlgorithm().subscribe((selectedAlg) => {
      this.algorithm = selectedAlg;
    });
  }
}
