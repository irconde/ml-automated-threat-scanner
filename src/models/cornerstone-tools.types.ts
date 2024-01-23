import { BoundingBox, Coordinate2D, Point } from './detection';

interface BoundingEditUpdate {
  handles: {
    start: Coordinate2D;
    end: Coordinate2D;
    start_prima: Coordinate2D;
    end_prima: {
      active: boolean;
      moving: boolean;
      hasMoved: boolean;
    } & Coordinate2D;
  };
  id: string;
  categoryName: string;
  algorithm: string;
  class: string;
  renderColor: string;
  confidence: number;
  updatingDetection: boolean;
  view: string;
  binaryMask: number[][];
  uuid: string;
  active: boolean;
  invalidated: boolean;
  segmentation?: Point[];
}

export type PolygonToolPayload = {
  bbox: BoundingBox;
  polygonMask: Point[];
};

export type BoundingEditToolState =
  | {
      data: BoundingEditUpdate[];
    }
  | undefined;

export type MovementToolState = {
  handles: {
    start: {
      x: number;
      y: number;
    };
    end: {
      x: number;
      y: number;
    };
  };
  id: string;
  renderColor: string;
  categoryName: string;
  updatingAnnotation: boolean;
  polygonCoords: Point[][];
};

export type MovementToolOutput = {
  data: {
    active: boolean;
    categoryName: string;
    handles: {
      end: { x: number; y: number };
      start: { x: number; y: number };
    };
    id: string;
    invalidated: boolean;
    polygonCoords: Point[][];
    renderColor: string;
    updatingAnnotation: boolean;
    uuid: string;
  }[];
};
