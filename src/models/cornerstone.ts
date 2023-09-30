import { AnnotationMode, CornerstoneMode } from '../enums/cornerstone';

export interface CornerstoneConfiguration {
  cornerstoneMode: CornerstoneMode;
  annotationMode: AnnotationMode;
}

export const CS_DEFAULT_CONFIGURATION: CornerstoneConfiguration = {
  cornerstoneMode: CornerstoneMode.Selection,
  annotationMode: AnnotationMode.NoTool,
} as const;

export interface CornerstoneHandles {
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
  handles: CornerstoneHandles;
  invalidated: boolean;
  updatingAnnotation: boolean;
  uuid: string;
  visible: boolean;
}
