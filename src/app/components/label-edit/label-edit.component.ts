import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { DetectionsService } from '../../services/detections/detections.service';
import { cornerstone } from '../../csSetup';
import {
  getViewportByViewpoint,
  updateCornerstoneViewports,
} from '../../utilities/cornerstone.utilities';
import { NgIf, NgStyle } from '@angular/common';
import { Coordinate2D, Detection } from '../../../models/detection';
import { ContextMenuService } from '../../services/context-menu/context-menu.service';
import { FormsModule } from '@angular/forms';
import { LabelListComponent } from './label-edit-list/label-list.component';
import { CommonDetections } from '../../../enums/cornerstone';

@Component({
  selector: 'app-label-edit',
  templateUrl: './label-edit.component.html',
  styleUrls: ['./label-edit.component.scss'],
  standalone: true,
  imports: [MatIconModule, NgStyle, FormsModule, NgIf, LabelListComponent],
})
export class LabelEditComponent implements OnInit {
  selectedDetection: Detection | null = null;
  @ViewChild('inputRef', { static: false }) inputRef!: ElementRef;
  zoomLevel: number = 1;
  size: { width: number; height: number } = { width: 0, height: 30 };
  position: Coordinate2D | null = { x: 0, y: 0 };
  enablePositionOffset = false;
  label: string = '';
  isListOpen: boolean = false;
  formattedLabels: string[] = [];
  cleared: boolean = false;

  constructor(
    private detectionService: DetectionsService,
    private contextMenuService: ContextMenuService,
  ) {
    this.detectionService
      .getSelectedDetection()
      .subscribe((selectedDetection) => {
        if (!selectedDetection) return;
        this.selectedDetection = selectedDetection;
        this.zoomLevel = this.detectionService.getZoomLevel(
          this.selectedDetection,
        )!;
        this.ngOnInit();
      });
  }

  ngOnInit(): void {
    if (!this.selectedDetection) return;
    this.label = this.selectedDetection.className;
    this.updatePosition(this.selectedDetection);
    this.detectionService.getLabels().subscribe((labels) => {
      this.formattedLabels = labels;
    });
  }

  toggleLabelList() {
    this.isListOpen = !this.isListOpen;
  }

  submit(listLabel: string = '', fromList: boolean = false) {
    if (this.selectedDetection) {
      const submittedLabel = fromList ? listLabel : this.label.trim();
      this.label =
        submittedLabel !== ''
          ? submittedLabel
          : CommonDetections.Unknown.toLowerCase();

      this.detectionService.setDetectionLabel(
        this.selectedDetection,
        this.label,
      );
      updateCornerstoneViewports();
      this.contextMenuService.isLabelEditVisible = false;
    }
  }

  submitFromInput(key: string) {
    if (key === 'Enter') {
      this.submit();
    }
  }

  submitFromList(label: string) {
    this.isListOpen = false;
    this.submit(label, true);
  }

  clearInput() {
    this.label = '';
    this.cleared = true;
  }

  updatePosition(selectedDetection: Detection | null) {
    if (!selectedDetection) {
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

    const scaleByZoom = (value: number) => value * this.zoomLevel;
    const getWidth = (width: number) => scaleByZoom(width) + 2;
    this.size.width = getWidth(width);
  }

  handleLabelEditPosition() {
    const offsetY = this.size.height - 5;
    const offsetX = 1;

    return {
      left: this.position!.x - offsetX + 'px' || '0px',
      top: this.position!.y + offsetY + 'px' || '0px',
      width: this.size.width + 'px' || '0px',
      display: this.contextMenuService.isLabelEditVisible ? 'flex' : 'none',
    };
  }
}
