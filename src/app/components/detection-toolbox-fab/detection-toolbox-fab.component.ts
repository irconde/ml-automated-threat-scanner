import { Component, OnInit } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { cornerstone, cornerstoneTools } from '../../csSetup';
import {
  AnnotationMode,
  CornerstoneMode,
  ToolNames,
} from '../../../enums/cornerstone';
import { CornerstoneService } from '../../services/cornerstone/cornerstone.service';

@Component({
  selector: 'app-detection-toolbox-fab',
  templateUrl: './detection-toolbox-fab.component.html',
  styleUrls: ['./detection-toolbox-fab.component.scss'],
  standalone: true,
  imports: [MatIconModule],
})
export class DetectionToolboxFabComponent implements OnInit {
  private annotationMode = AnnotationMode.NoTool;

  constructor(private cornerstoneService: CornerstoneService) {}

  ngOnInit() {
    this.cornerstoneService.getCsConfiguration().subscribe((config) => {
      this.annotationMode = config.annotationMode;
    });
  }

  get disabled() {
    return (
      this.annotationMode === AnnotationMode.Bounding ||
      this.annotationMode === AnnotationMode.Polygon
    );
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

    this.updateCornerstoneViewports();
    this.cornerstoneService.setCsConfiguration({
      annotationMode: AnnotationMode.Bounding,
      cornerstoneMode: CornerstoneMode.Annotation,
    });
  }

  updateCornerstoneViewports() {
    const viewports = document.getElementsByClassName(
      'viewportElement',
    ) as HTMLCollectionOf<HTMLElement>;

    for (let i = 0; i < viewports.length; i++) {
      cornerstone.updateImage(viewports[i], true);
    }
  }
}
