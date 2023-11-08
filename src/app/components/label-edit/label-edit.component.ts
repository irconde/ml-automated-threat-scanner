import { Component, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DetectionsService } from '../../services/detections/detections.service';
import { cornerstone } from '../../csSetup';
import { getViewportByViewpoint } from '../../utilities/cornerstone.utilities';
import { NgStyle } from '@angular/common';
import { Coordinate2D, Detection } from '../../../models/detection';

@Component({
  selector: 'app-label-edit',
  templateUrl: './label-edit.component.html',
  styleUrls: ['./label-edit.component.scss'],
  standalone: true,
  imports: [MatIconModule, NgStyle],
})
export class LabelEditComponent implements OnInit {
  selectedDetection: Detection | null = null;
  @ViewChild('inputRef', { static: false }) inputRef: HTMLElement =
    document.getElementById('input-label')!;
  zoomLevel: number | null = null;
  size: { width: number; height: number } = { width: 0, height: 30 };
  isVisible: boolean = false;
  position: Coordinate2D | null = { x: 0, y: 0 };
  enablePositionOffset = false;
  label: string = '';

  constructor(private detectionService: DetectionsService) {
    this.detectionService
      .getSelectedDetection()
      .subscribe((selectedDetection) => {
        if (!selectedDetection) return;
        this.selectedDetection = selectedDetection;
        this.ngOnInit();
      });
  }

  ngOnInit(): void {
    // Use this.zoomLevel, this.isVisible, this.selectedAnnotation here
    console.log('LabelEditComponent ngOnInit()');
    if (!this.selectedDetection) return;
    this.label = this.selectedDetection.className;
    this.zoomLevel = this.detectionService.getZoomLevel(
      this.selectedDetection,
    )!;
    this.updatePosition(this.selectedDetection);
  }

  updatePosition(selectedDetection: Detection | null) {
    if (selectedDetection === null) {
      this.position = null;
      return;
    }
    const width = selectedDetection.boundingBox[2];
    const viewport: HTMLElement = getViewportByViewpoint(
      selectedDetection.viewpoint,
    );
    const viewportOffset =
      selectedDetection.viewpoint === 'side' && this.enablePositionOffset
        ? viewport.clientWidth
        : viewport.offsetLeft;
    const { x, y } = cornerstone.pixelToCanvas(viewport, {
      x: selectedDetection.boundingBox[0],
      y: selectedDetection.boundingBox[1],
      _pixelCoordinateBrand: '',
    });

    this.position = { x: x + viewportOffset, y: y };
    this.size.width = width;
  }

  handleLabelEditPosition() {
    console.log({ position: this.position, size: this.size });
    this.isVisible = this.selectedDetection !== null;
    const offsetY = this.size.height / 2 + 2;
    const offsetX = 1;

    return {
      left: this.position!.x - offsetX + 'px' || '0px',
      top: this.position!.y + offsetY + 'px' || '0px',
      width: this.size.width + 'px' || '0px',
      display: this.isVisible ? 'flex' : 'none',
    };
  }

  submit(value: string) {
    console.log('LabelEditComponent submit():' + value);
  }

  submitFromInput(key: string) {
    if (key !== 'Enter') return;
    this.submit(this.label.trim() || 'unknown');
  }

  // submitFromList(label: string) {
  //   this.isListOpen = false;
  //   this.submit(label);
  // }
  //
  // submitFromInput(event: KeyboardEvent) {
  //   if (event.key !== 'Enter') return;
  //   this.submit(this.value.trim() || this.unknown);
  // }
  //
  // clearInput() {
  //   this.inputRef.nativeElement.focus();
  //   this.value = '';
  // }
  //
  // toggleList() {
  //   if (this.isListOpen) {
  //     setTimeout(() => this.inputRef.nativeElement.focus(), 0);
  //   }
  //   this.isListOpen = !this.isListOpen;
  // }

  // submit(value: string) {
  //   this.store.dispatch(updateEditLabelVisibility(false));
  //   this.store.dispatch(updateAnnotationContextVisibility(true));
  //   Utils.dispatchAndUpdateImage(this.store, updateAnnotationCategory, {
  //     id: this.selectedAnnotation.id,
  //     newCategory: value,
  //   });
  //   this.value = '';
  // }

  // getWidth(width: number): number {
  //   return this.scaleByZoom(width) + this.borderWidth;
  // }

  // scaleByZoom(value: number): number {
  //   return value * this.zoomLevel;
  // }
}
