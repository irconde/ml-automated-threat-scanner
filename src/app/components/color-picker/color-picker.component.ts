import { AfterViewInit, Component } from '@angular/core';
import { NgForOf, NgIf, NgStyle } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EditionMode } from '../../../enums/cornerstone';
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
    this.selectedColor = this.selectedDetection.color;
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
    console.log(this.position);
  }

  handleChange(event: Event) {
    this.selectedColor = (event.target as HTMLInputElement).value;
    this.updateDetectionColor(this.selectedColor);
  }

  updateDetectionColor(color: string): void {
    console.log(color);
  }
}
