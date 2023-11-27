import { CommonDetections } from '../enums/cornerstone';

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

export interface DetectionAlgorithm
  extends Partial<{
    name: string;
    detectorType: string;
    detectorConfiguration: string;
    series: string;
    study: string;
  }> {}

export type DetectionGroupMetaData = {
  selected: boolean;
  visible: boolean;
  collapsed: boolean;
};

export type DetectionGroups = Record<string, DetectionGroupMetaData>;

export class DetectionClass {
  algorithm: string;
  className: string;
  confidence: number;
  viewpoint: string;
  binaryMask?: number[][];
  uuid: string;
  detectionFromFile: boolean;
  boundingBox: BoundingBox;
  selected: boolean;
  visible: boolean;
  color: string;
  iscrowd: 1 | 0;
  categoryName: string;
  polygonMask?: Point[] = undefined;
  imageId?: string;

  constructor(detection: RawDetection) {
    this.algorithm = detection.algorithm;
    this.className = detection.className;
    this.confidence = detection.confidence;
    this.binaryMask = detection.binaryMask;
    this.viewpoint = detection.viewpoint;
    this.uuid = detection.uuid;
    this.detectionFromFile = detection.detectionFromFile;
    this.boundingBox = detection.boundingBox;
    if ('polygonMask' in detection) {
      this.polygonMask = detection.polygonMask;
    }
    if ('imageId' in detection) {
      this.imageId = detection.imageId;
    }
    this.selected = false;
    this.visible = true;
    this.color = 'orange';
    this.iscrowd = 0;
    this.categoryName = CommonDetections.Operator;
  }

  public get groupName() {
    return this.algorithm || this.categoryName;
  }
}
