import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { cornerstoneTools } from '../../csSetup';
import {
  AnnotationMode,
  CornerstoneMode,
  ToolNames,
} from '../../../enums/cornerstone';
import { CornerstoneService } from '../../services/cornerstone/cornerstone.service';
import { DetectionsService } from '../../services/detections/detections.service';

@Component({
  selector: 'app-detection-toolbox-fab',
  templateUrl: './detection-toolbox-fab.component.html',
  styleUrls: ['./detection-toolbox-fab.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class DetectionToolboxFabComponent implements OnInit {
  private annotationMode = AnnotationMode.NoTool;

  constructor(
    private cornerstoneService: CornerstoneService,
    private detectionsService: DetectionsService,
  ) {}

  get disabled() {
    return (
      this.annotationMode === AnnotationMode.Bounding ||
      this.annotationMode === AnnotationMode.Polygon
    );
  }

  ngOnInit() {
    this.cornerstoneService.getCsConfiguration().subscribe((config) => {
      this.annotationMode = config.annotationMode;
    });
  }

  handlePolygonBtnClick() {}

  handleRectangleBtnClick() {
    cornerstoneTools.setToolOptions(ToolNames.BoundingBox, {
      cornerstoneMode: CornerstoneMode.Annotation,
      annotationMode: AnnotationMode.Bounding,
    });

    cornerstoneTools.setToolActive(ToolNames.BoundingBox, {
      mouseButtonMask: 1,
    });

    this.cornerstoneService.setCsConfiguration({
      annotationMode: AnnotationMode.Bounding,
      cornerstoneMode: CornerstoneMode.Annotation,
    });
    this.detectionsService.clearSelectedDetection();
  }
}
