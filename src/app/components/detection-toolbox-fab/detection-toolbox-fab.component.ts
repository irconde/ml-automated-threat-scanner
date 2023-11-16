import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import {
  AnnotationMode,
  CornerstoneMode,
  EditionMode,
  ToolNames,
} from '../../../enums/cornerstone';
import { CornerstoneService } from '../../services/cornerstone/cornerstone.service';
import { DetectionsService } from '../../services/detections/detections.service';
import { setCornerstoneToolActive } from '../../utilities/cornerstone.utilities';

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

  handleFabButtonClick(isBounding: boolean) {
    const setup = isBounding
      ? {
          toolName: ToolNames.BoundingBox,
          annotationMode: AnnotationMode.Bounding,
        }
      : {
          toolName: ToolNames.Polygon,
          annotationMode: AnnotationMode.Polygon,
        };

    const csConfiguration = {
      cornerstoneMode: CornerstoneMode.Annotation,
      annotationMode: setup.annotationMode,
      editionMode: EditionMode.NoTool,
    };
    setCornerstoneToolActive(setup.toolName, {
      ...csConfiguration,
      updatingAnnotation: false,
    });

    this.cornerstoneService.setCsConfiguration(csConfiguration);
    this.detectionsService.clearDetectionsSelection();
  }
}
