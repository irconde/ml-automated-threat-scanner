export type BoundingBox = number[];
export type Coordinate2D = { x: number; y: number };
export type Dimension2D = { width: number; height: number };
export type PolygonData = { [key: number]: Coordinate2D };

export enum DetectionType {
  COCO = 'MS COCO',
  TDR = 'DICOS TDR',
  UNKNOWN = 'UNKNOWN',
}

export interface Point extends Coordinate2D {
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
  boundingBox: BoundingBox;
}

export interface RawDicosDetection extends RawGeneralDetection {}

export interface RawCocoDetection extends RawGeneralDetection {
  polygonMask?: Point[];
  imageId: string;
}

export type RawDetection = RawCocoDetection | RawDicosDetection;

interface DetectionStateProps {
  selected: boolean;
  visible: boolean;
  color: string;
  categorySelected: boolean;
  id: string;
  iscrowd: 1 | 0;
  categoryName: string;
}

export type Detection = RawDetection & DetectionStateProps;

export interface CornerstoneClickEvent extends Event {
  detail?: {
    currentPoints?: {
      canvas?: Coordinate2D;
    };
  };
}
