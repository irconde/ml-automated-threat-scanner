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
import { UiService } from '../../services/ui/ui.service';
import { NgIf, NgStyle } from '@angular/common';
import { ImageStatus } from '../../services/ui/model/enum';

@Component({
  selector: 'app-detection-toolbox-fab',
  templateUrl: './detection-toolbox-fab.component.html',
  styleUrls: ['./detection-toolbox-fab.component.scss'],
  standalone: true,
  imports: [MatIconModule, NgStyle, NgIf],
})
export class DetectionToolboxFabComponent implements OnInit {
  protected isVisible: boolean = false;
  private annotationMode = AnnotationMode.NoTool;
  protected disabled = false;

  constructor(
    private cornerstoneService: CornerstoneService,
    private detectionsService: DetectionsService,
    private uiService: UiService,
  ) {}

  ngOnInit() {
    this.cornerstoneService.getCsConfiguration().subscribe((config) => {
      this.annotationMode = config.annotationMode;
      this.disabled =
        config.annotationMode !== AnnotationMode.NoTool ||
        config.editionMode !== EditionMode.NoTool;
    });

    this.uiService.getImageStatus().subscribe((status) => {
      this.isVisible = status !== ImageStatus.NoImage;
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
