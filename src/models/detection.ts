export type BoundingBox = [number, number, number, number];
export type Coordinate2D = { x: number; y: number };
export type PolygonData = { [key: number]: Coordinate2D };

export interface Point {
  x: number;
  y: number;
  anchor: { top: number; bottom: number; left: number; right: number };
}
