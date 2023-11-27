import { AfterViewInit, Component, Renderer2 } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DetectionsService } from '../../services/detections/detections.service';
import { cornerstone } from '../../csSetup';
import {
  getViewportByViewpoint,
  updateCornerstoneViewports,
} from '../../utilities/cornerstone.utilities';
import { NgIf, NgStyle } from '@angular/common';
import { Coordinate2D, DetectionClass } from '../../../models/detection';
import { FormsModule } from '@angular/forms';
import { LabelListComponent } from './label-edit-list/label-list.component';
import {
  AnnotationMode,
  CommonDetections,
  CornerstoneMode,
  EditionMode,
} from '../../../enums/cornerstone';
import { CornerstoneService } from '../../services/cornerstone/cornerstone.service';

@Component({
  selector: 'app-label-edit',
  templateUrl: './label-edit.component.html',
  styleUrls: ['./label-edit.component.scss'],
  standalone: true,
  imports: [MatIconModule, NgStyle, FormsModule, NgIf, LabelListComponent],
})
export class LabelEditComponent implements AfterViewInit {
  selectedDetection: DetectionClass | null = null;
  zoomLevel: number = 1;
  size: { width: number; height: number } = { width: 0, height: 30 };
  position: Coordinate2D | null = { x: 0, y: 0 };
  enablePositionOffset = false;
  label: string = '';
  isListOpen: boolean = false;
  formattedLabels: string[] = [];
  isShown: boolean = false;

  constructor(
    private detectionService: DetectionsService,
    public csService: CornerstoneService,
    private renderer: Renderer2,
  ) {}

  ngAfterViewInit(): void {
    this.csService.getCsConfiguration().subscribe((config) => {
      if (config.editionMode === EditionMode.Label) {
        const subscription = this.detectionService
          .getSelectedDetection()
          .subscribe((det) => {
            this.selectedDetection = det;
            this.updatePosition();
            this.updateContent();
            this.isShown = true;
            this.focusInput();
          });
        subscription.unsubscribe();
      } else {
        this.isShown = false;
      }
    });
  }

  handleChange(event: Event) {
    const value = (event.target as HTMLInputElement).value;
    this.label = value;
    this.updateDetectionLabel(value, false);
  }

  toggleLabelList() {
    this.isListOpen = !this.isListOpen;
    if (!this.isListOpen) {
      this.focusInput();
    }
  }

  onKeyDown(key: string) {
    if (key === 'Enter') {
      this.updateDetectionLabel(this.label, true);
    }
  }

  submitFromList(label: string) {
    this.isListOpen = false;
    this.updateDetectionLabel(label);
  }

  clearInput() {
    this.label = '';
    this.updateDetectionLabel('', false);
    this.focusInput();
  }

  private updateDetectionLabel(value: string, closeWidget = true) {
    this.detectionService.setDetectionLabel(
      value.trim() || CommonDetections.Unknown,
    );
    updateCornerstoneViewports();
    if (!closeWidget) return;
    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.NoTool,
    });
  }

  private focusInput() {
    setTimeout(() => {
      this.renderer.selectRootElement('#label-input').focus();
    }, 0);
  }

  private updateContent(): void {
    if (!this.selectedDetection) return;
    this.label = this.selectedDetection.className;
    this.detectionService.getLabels().subscribe((labels) => {
      this.formattedLabels = labels;
    });
    this.isListOpen = false;
  }

  private updatePosition() {
    if (!this.selectedDetection) return;
    const width = this.selectedDetection.boundingBox[2];
    const viewport: HTMLElement = getViewportByViewpoint(
      this.selectedDetection.viewpoint,
    );
    const viewportOffset =
      this.selectedDetection.viewpoint === 'side' && this.enablePositionOffset
        ? viewport.clientWidth
        : viewport.offsetLeft;
    const { x, y } = cornerstone.pixelToCanvas(viewport, {
      x: this.selectedDetection.boundingBox[0],
      y: this.selectedDetection.boundingBox[1],
      _pixelCoordinateBrand: '',
    });

    this.position = { x: x + viewportOffset, y: y };

    const scaleByZoom = (value: number) => value * this.zoomLevel;
    const getWidth = (width: number) => scaleByZoom(width) + 2;
    this.size.width = getWidth(width);
  }
}
