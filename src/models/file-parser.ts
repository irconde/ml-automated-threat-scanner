export enum AnnotationType {
  COCO = "MS COCO",
  TDR = "DICOS TDR",
}

export interface CanvasViewpoint {
  viewpoint: string;
  pixelData: string;
  imageId: string;
  detectionData: string[];
}

export interface ParsedORA {
  format: string;
  viewpoints: CanvasViewpoint[];
}
