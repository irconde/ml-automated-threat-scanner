import { DetectionType } from './detection';

export interface CanvasViewpoint {
  viewpoint: string;
  pixelData: string;
  imageId: string;
  detectionData: string[];
}

export interface ParsedORA {
  format: DetectionType;
  viewpoints: CanvasViewpoint[];
}

export interface PixelData {
  viewpoint: string;
  pixelData: Blob | ArrayBuffer;
  imageId: string;
  type: DetectionType;
}
