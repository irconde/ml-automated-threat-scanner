export enum AnnotationType {
  COCO = "MS COCO",
  TDR = "DICOS TDR",
  UNKNOWN = "UNKNOWN",
}

export interface CanvasViewpoint {
  viewpoint: string;
  pixelData: string;
  imageId: string;
  detectionData: string[];
}

export interface ParsedORA {
  format: AnnotationType;
  viewpoints: CanvasViewpoint[];
}

export interface PixelData {
  viewpoint: string;
  pixelData: Blob | ArrayBuffer,
  imageId: string;
  type: AnnotationType,
}
