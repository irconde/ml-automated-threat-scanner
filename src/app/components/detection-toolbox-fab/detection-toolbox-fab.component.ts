import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-detection-toolbox-fab',
  templateUrl: './detection-toolbox-fab.component.html',
  styleUrls: ['./detection-toolbox-fab.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class DetectionToolboxFabComponent implements OnInit {
  constructor() {}

  ngOnInit() {}
}
