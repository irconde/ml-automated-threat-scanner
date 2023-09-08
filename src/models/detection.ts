export type BoundingBox = [number, number, number, number];
export type Coordinate2D = { x: number; y: number };
export type PolygonData = { [key: number]: Coordinate2D };

export enum DetectionType {
  COCO = 'MS COCO',
  TDR = 'DICOS TDR',
  UNKNOWN = 'UNKNOWN',
}

export interface Point {
  x: number;
  y: number;
  anchor: { top: number; bottom: number; left: number; right: number };
}

interface RawGeneralDetection {
  algorithm: string;
  className: string;
  confidence: number;
  viewpoint: string;
  binaryMask?: number[][];
  uuid: string;
  detectionFromFile: boolean;
}

export interface RawDicosDetection extends RawGeneralDetection {
  boundingBox: number[];
}

export interface RawCocoDetection extends RawGeneralDetection {
  polygonMask: Point[];
  boundingBox: BoundingBox;
  imageId: string;
}

export type RawDetection = RawCocoDetection | RawDicosDetection;

interface DetectionStateProps {
  selected: boolean;
  visible: boolean;
  color: string;
  categorySelected: boolean;
  id: string;
  isCrowd: boolean;
  categoryName: string;
}

export type Detection = RawDetection & DetectionStateProps;
