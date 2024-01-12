import {
  AnnotationMode,
  CornerstoneMode,
  EditionMode,
} from '../enums/cornerstone';
import { Coordinate2D } from './detection';

export interface CornerstoneConfiguration {
  cornerstoneMode: CornerstoneMode;
  annotationMode: AnnotationMode;
  editionMode: EditionMode;
}

export const CS_DEFAULT_CONFIGURATION: CornerstoneConfiguration = {
  cornerstoneMode: CornerstoneMode.Selection,
  annotationMode: AnnotationMode.NoTool,
  editionMode: EditionMode.NoTool,
} as const;

export interface CornerstoneBboxHandles {
  start: {
    x: number;
    y: number;
    highlight: boolean;
    active: boolean;
  };
  end: {
    x: number;
    y: number;
    highlight: boolean;
    active: boolean;
    moving?: boolean; // Optional property
  };
  start_prima: {
    x: number;
    y: number;
    highlight: boolean;
    active: boolean;
  };
  end_prima: {
    x: number;
    y: number;
    highlight: boolean;
    active: boolean;
  };
  initialRotation: number;
  textBox: {
    active: boolean;
    hasMoved: boolean;
    movesIndependently: boolean;
    drawnIndependently: boolean;
    allowedOutsideImage: boolean;
    hasBoundingBox: boolean;
  };
}

export interface CreatedBoundingBox {
  active: boolean;
  categoryName: string;
  color?: string;
  handles: CornerstoneBboxHandles;
  invalidated: boolean;
  updatingAnnotation: boolean;
  uuid: string;
  visible: boolean;
}

export interface PolygonPoint extends Coordinate2D {
  highlight: boolean;
  active: boolean;
  lines: Coordinate2D[];
}

export interface PolygonTextBox {
  active: boolean;
  hasMoved: boolean;
  movesIndependently: boolean;
  drawnIndependently: boolean;
  allowedOutsideImage: boolean;
  hasBoundingBox: boolean;
}

export interface PolygonHandles {
  points: PolygonPoint[];
  textBox: PolygonTextBox;
  invalidHandlePlacement: boolean;
}
