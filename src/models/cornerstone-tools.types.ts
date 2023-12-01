import { Coordinate2D, Point } from './detection';

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

export type BoundingEditToolState =
  | {
      data: BoundingEditUpdate[];
    }
  | undefined;
