import { AfterViewInit, Component } from '@angular/core';
import { NgForOf, NgIf, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AnnotationMode,
  CornerstoneMode,
  EditionMode,
} from '../../../enums/cornerstone';
import { DetectionsService } from '../../services/detections/detections.service';
import { CornerstoneService } from '../../services/cornerstone/cornerstone.service';
import { Coordinate2D, Detection } from '../../../models/detection';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  standalone: true,
  imports: [NgForOf, FormsModule, NgIf, NgStyle],
})
export class ColorPickerComponent implements AfterViewInit {
  topRowColors: string[] = [
    '#ff6900',
    '#fcb900',
    '#7bdcb5',
    '#00d084',
    '#8ed1fc',
    '#0693e3',
    '#a2afb9',
  ];
  bottomRowColors: string[] = ['#eb144c', '#f78da7', '#9900ef'];
  selectedColor: string = '';
  selectedDetection: Detection | null = null;
  position: Coordinate2D | null = { x: 0, y: 0 };
  isShown: boolean = false;

  constructor(
    private detectionService: DetectionsService,
    public csService: CornerstoneService,
  ) {}

  ngAfterViewInit(): void {
    this.csService.getCsConfiguration().subscribe((config) => {
      if (config.editionMode === EditionMode.Color) {
        const subscription = this.detectionService
          .getSelectedDetection()
          .subscribe((det) => {
            this.selectedDetection = det;
            this.updatePosition();
            this.updateContent();
            this.isShown = true;
          });
        subscription.unsubscribe();
      } else {
        this.isShown = false;
      }
    });
  }

  private updateContent(): void {
    if (!this.selectedDetection) return;
    this.selectedColor = this.selectedDetection.color.replace(/^#/, '');
  }

  private updatePosition() {
    if (!this.selectedDetection) return;

    const yOffset = 55;
    const xOffset = 305;

    const contextMenuPosition = this.detectionService.getContextMenuPosition();

    this.position = {
      x: contextMenuPosition!.x - xOffset,
      y: contextMenuPosition!.y - yOffset,
    };
  }

  rgbToHex = (rgbString: string): string => {
    const match = rgbString.match(/^rgb\((\d+),\s*(\d+),\s*(\d+)\)$/);

    if (match) {
      const [, r, g, b] = match.map(Number);

      const componentToHex = (c: number): string => {
        const hex = c.toString(16);
        return hex.length === 1 ? '0' + hex : hex;
      };

      return (
        componentToHex(r) +
        componentToHex(g) +
        componentToHex(b)
      ).toUpperCase();
    } else {
      throw new Error('Invalid RGB string format');
    }
  };

  handleChange(event: Event) {
    this.selectedColor = (
      event.target as HTMLInputElement
    ).style.backgroundColor;
    this.selectedColor = this.rgbToHex(this.selectedColor);
    this.updateDetectionColor();
  }

  onKeyDown(key: string) {
    if (key === 'Enter') {
      this.updateDetectionColor();
    }
  }

  updateDetectionColor() {
    this.detectionService.setDetectionColor('#' + this.selectedColor);
    this.csService.setCsConfiguration({
      cornerstoneMode: CornerstoneMode.Selection,
      annotationMode: AnnotationMode.NoTool,
      editionMode: EditionMode.NoTool,
    });
  }
}

/*
* //TODO
*
* Make 2nd click close the menu
*
* Make the clicked swatch highlight blue
*
* Figure out how to make the menu stay inside the viewport
*
* */
