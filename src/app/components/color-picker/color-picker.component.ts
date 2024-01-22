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
import { Detection } from '../../../models/detection';

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

    const colorString = this.selectedDetection.color;

    // Check if the color string starts with '#'
    if (colorString.startsWith('#')) {
      // If it starts with '#', remove the '#' symbol
      this.selectedColor = colorString.replace(/^#/, '').toUpperCase();
    } else {
      // If it doesn't start with '#', assume it's a color name and convert to hex
      const hexColor = this.colorNameToHex(colorString);
      if (hexColor !== null) {
        this.selectedColor = hexColor.toUpperCase();
      } else {
        console.error('Invalid color name:', colorString);
      }
    }
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

  colorNameToHex = (colorName: string): string | null => {
    const colorNamesMap: Record<string, string> = {
      red: '#FF0000',
      orange: '#FFA500',
      yellow: '#FFFF00',
      green: '#008000',
      blue: '#0000FF',
      purple: '#800080',
      pink: '#FFC0CB',
      brown: '#A52A2A',
      gray: '#808080',
      black: '#000000',
      white: '#FFFFFF',
    };

    return colorNamesMap[colorName] || null;
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
    this.detectionService.clearDetectionsSelection();
  }
}

/*
* //TODO
*
* Figure out how to make the menu stay inside the viewport
*
* */
