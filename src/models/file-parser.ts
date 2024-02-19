import { DetectionAlgorithm, DetectionType, RawDetection } from './detection';

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

export type FileParserOutput = {
  detectionData: RawDetection[];
  pixelDataList: PixelData[];
  algorithms?: Record<string, DetectionAlgorithm>;
};
