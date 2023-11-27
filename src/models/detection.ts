import { CommonDetections, EditionMode } from '../enums/cornerstone';
import {
  getTextLabelSize,
  hexToCssRgba,
  limitCharCount,
} from '../app/utilities/text.utilities';
import { DETECTION_STYLE } from '../enums/detection-styles';
import {
  renderBinaryMasks,
  renderPolygonMasks,
} from '../app/utilities/detection.utilities';

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

export class Detection {
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

  public display = (
    context: CanvasRenderingContext2D,
    anyDetectionSelected: boolean,
    editionMode: EditionMode,
    zoom: number,
  ) => {
    if (
      !this.visible ||
      (this.selected && editionMode !== EditionMode.NoTool)
    ) {
      return;
    }

    const renderColor = this.getRenderColor(anyDetectionSelected);
    context.strokeStyle = renderColor;
    context.fillStyle = renderColor;

    const [x, y, w, h] = this.boundingBox;

    context.strokeRect(x, y, w, h);

    context.globalAlpha = 0.5;
    if ('polygonMask' in this && this.polygonMask?.length) {
      renderPolygonMasks(context, this.polygonMask);
    } else if (this.binaryMask) {
      renderBinaryMasks(this.binaryMask, context, zoom);
    }

    context.globalAlpha = 1.0;

    this.renderLabel(context, zoom);
  };

  /**
   * Draws the detection label with the font size based on the zoom level
   */
  private renderLabel = (context: CanvasRenderingContext2D, zoom: number) => {
    const labelText = limitCharCount(this.className);
    const { LABEL_PADDING, LABEL_HEIGHT } = DETECTION_STYLE;
    const { width, height } = getTextLabelSize(
      context,
      labelText,
      LABEL_PADDING.LEFT,
      zoom,
      LABEL_HEIGHT,
    );

    const [x, y] = this.boundingBox;
    context.fillRect(x - context.lineWidth / 2, y - height, width, height);
    context.fillStyle = DETECTION_STYLE.LABEL_TEXT_COLOR;
    context.fillText(
      labelText,
      x + (LABEL_PADDING.LEFT - 1) / zoom,
      y - LABEL_PADDING.BOTTOM / zoom,
    );
  };

  private getRenderColor = (anyDetectionSelected: boolean): string => {
    if (this.selected) {
      return DETECTION_STYLE.SELECTED_COLOR;
    } else if (anyDetectionSelected) {
      return hexToCssRgba(this.color);
    } else return this.color;
  };
}
