import { Component } from '@angular/core';
import { NgForOf } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-color-picker',
  templateUrl: './color-picker.component.html',
  styleUrls: ['./color-picker.component.scss'],
  standalone: true,
  imports: [NgForOf, FormsModule],
})
export class ColorPickerComponent {
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
}


// import { NgIf } from '@angular/common';
// import { FormsModule } from '@angular/forms';
// import { Coordinate2D, Detection } from '../../../models/detection';
// import { AfterViewInit, Component } from '@angular/core';
// import { DetectionsService } from '../../services/detections/detections.service';
// import { CornerstoneService } from '../../services/cornerstone/cornerstone.service';
// import {
//   AnnotationMode,
//   CornerstoneMode,
//   EditionMode,
// } from '../../../enums/cornerstone';
// import { updateCornerstoneViewports } from '../../utilities/cornerstone.utilities';
//
// @Component({
//   selector: 'app-color-picker',
//   templateUrl: './color-picker.component.html',
//   styleUrls: ['./color-picker.component.scss'],
//   standalone: true,
//   imports: [FormsModule, NgIf],
// })
// export class ColorPickerComponent implements AfterViewInit {
//   selectedDetection: Detection | null = null;
//   position: Coordinate2D | null = { x: 0, y: 0 };
//   isShown: boolean = false;
//   // enablePositionOffset = false;
//   color: string = '';
//
//   constructor(
//     private detectionService: DetectionsService,
//     public csService: CornerstoneService,
//   ) {}
//
//   ngAfterViewInit(): void {
//     this.csService.getCsConfiguration().subscribe((config) => {
//       if (config.editionMode === EditionMode.Label) {
//         const subscription = this.detectionService
//           .getSelectedDetection()
//           .subscribe((det) => {
//             this.selectedDetection = det;
//             // this.updatePosition();
//             // this.updateContent();
//             this.isShown = true;
//             // this.focusInput();
//           });
//         subscription.unsubscribe();
//       } else {
//         this.isShown = false;
//       }
//     });
//   }
//
//   handleChange(event: Event) {
//     const value = (event.target as HTMLInputElement).value;
//     this.color = value;
//     this.updateDetectionColor(value, false);
//   }
//
//   private updateDetectionColor(value: string, closeWidget = true) {
//     this.detectionService.setDetectionColor(value.trim());
//     updateCornerstoneViewports();
//     if (!closeWidget) return;
//     this.csService.setCsConfiguration({
//       cornerstoneMode: CornerstoneMode.Selection,
//       annotationMode: AnnotationMode.NoTool,
//       editionMode: EditionMode.NoTool,
//     });
//   }
//
//   // colorChangeSubmit(color: any): void {
//   //   TODO: ADD COLOR CHANGE SUBMIT
//   // }
// }
