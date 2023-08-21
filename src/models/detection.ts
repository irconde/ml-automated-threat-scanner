export type BoundingBox = [number, number, number, number];
export type Coordinate2D = { x: number; y: number };
export type PolygonData = { [key: number]: Coordinate2D };

export interface Point {
  x: number;
  y: number;
  anchor: { top: number; bottom: number; left: number; right: number };
}

interface GeneralDetection {
  algorithm: string;
  className: string;
  confidence: number;
  viewpoint: string;
  binaryMask?: number[][];
  polygonMask: Point[];
  uuid: string;
  detectionFromFile: boolean;
}

export interface DicosDetection extends GeneralDetection {
  boundingBox: number[];
}

export interface CocoDetection extends GeneralDetection {
  boundingBox: BoundingBox;
  imageId: string;
}

export type Detection = CocoDetection | DicosDetection;
