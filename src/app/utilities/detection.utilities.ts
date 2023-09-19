import {BoundingBox, Coordinate2D, Point, PolygonData,} from '../../models/detection';

/**
 * Converts COCO bbox to a bounding box
 *
 * @param {{x, y, width, height}} bbox
 * @returns {{x_start, y_start, x_end, y_end}}
 */
export const cocoBoxToBoundingBox = (bbox: BoundingBox): BoundingBox => {
  bbox[2] = bbox[0] + bbox[2];
  bbox[3] = bbox[1] + bbox[3];
  return bbox;
};

/**
 * Returns an object with polygon and binary mask properties depending on the segmentation
 *
 * @param {{x_start, y_start, x_end, y_end}} boundingBox
 * @param {Array} segmentation
 * @returns {{polygonMask: [], binaryMask: []}}
 */
export const getMasks = (
  boundingBox: BoundingBox,
  segmentation: number[][],
): { polygonMask: Point[]; binaryMask: number[][] | undefined } => {
  let binaryMask: number[][] | undefined;
  let polygonMask: Point[] = [];
  if (segmentation.length > 0) {
    const polygonXY = coordinatesToPolygonData(segmentation[0]);
    polygonMask = polygonDataToXYArray(polygonXY, boundingBox);
    binaryMask = polygonToBinaryMask(polygonMask);
  } else {
    binaryMask = [
      [],
      [boundingBox[0], boundingBox[1]],
      [boundingBox[2] - boundingBox[0], boundingBox[3] - boundingBox[1]],
    ];
  }

  return { binaryMask, polygonMask };
};

/**
 * Converts a list of handles into an array of float values representing the coordinates of a polygon
 *
 * @param coordinates - The coordinates of a rectangle's diagonals (x_1, y_1, x_2, y_2, ...x_n, y_n )
 * @returns - Object of handles, i.e., the vertices, of a polygon
 */
const coordinatesToPolygonData = (coordinates: number[]): PolygonData => {
  const data: PolygonData = {};
  let count = 0;
  for (let i = 0; i < coordinates.length; i += 2) {
    data[count] = { x: coordinates[i], y: coordinates[i + 1] };
    count++;
  }
  return data;
};

/**
 * Converts a list of handles into an array of objects with x, y float values
 * It will as well, calculate anchor points in percentage values of each point
 * corresponding to each wall of the bounding box(top/bottom/left/right). Which
 * represents its position as a percentage value inside the bounding box.
 *
 * @param {Array<number>} polygonData - List of handles, i.e., the vertices, of a polygon
 * @param {Array<number>} boundingBox - List of bounding box coords
 * @returns {Array<{x: number, y: number, anchor: {top: number, bottom: number, left: number, right: number}}>}
 */
const polygonDataToXYArray = (
  polygonData: PolygonData,
  boundingBox: BoundingBox,
): Point[] => {
  const xDist = boundingBox[2] - boundingBox[0];
  const yDist = boundingBox[3] - boundingBox[1];
  const points = [];
  for (const index in polygonData) {
    points.push({
      x: polygonData[index].x,
      y: polygonData[index].y,
      anchor: {
        top: ((boundingBox[3] - polygonData[index].y) / yDist) * 100,
        bottom: ((polygonData[index].y - boundingBox[1]) / yDist) * 100,
        left: ((polygonData[index].x - boundingBox[0]) / xDist) * 100,
        right: ((boundingBox[2] - polygonData[index].x) / xDist) * 100,
      },
    });
  }
  return points;
};

/**
 * Converts the polygon mask associated with a detection to its binary mask counterpart
 *
 * @param {Array<number>} coords - Polygon mask's coordinates
 * @returns {Array<Array<number>>} - Converted binary mask
 *
 */
const polygonToBinaryMask = (
  coords: Coordinate2D[],
): number[][] | undefined => {
  if (coords === undefined || coords === null || coords.length === 0) {
    return;
  }

  const n = coords.length;

  const min: Coordinate2D = {
    x: 99999,
    y: 99999,
  };
  const max: Coordinate2D = {
    x: 0,
    y: 0,
  };

  for (let i = 0; i < coords.length; i++) {
    //MIN
    if (coords[i].x < min.x) min.x = Math.floor(coords[i].x);
    if (coords[i].y < min.y) min.y = Math.floor(coords[i].y);

    //MAX
    if (coords[i].x > max.x) max.x = Math.floor(coords[i].x);
    if (coords[i].y > max.y) max.y = Math.floor(coords[i].y);
  }

  const x_diff = max.x - min.x;
  const y_diff = max.y - min.y;

  const bitmap = [];

  for (let i = 0; i < y_diff; i++) {
    for (let j = 0; j < x_diff; j++) {
      const p = {
        //Create new point to determine if within polygon.
        x: j + min.x,
        y: i + min.y,
      };
      bitmap[j + i * x_diff] = isInside(coords, n, p) ? 1 : 0;
    }
  }

  const data: number[][] = [];
  data[0] = bitmap;
  data[1] = [min.x, min.y];
  data[2] = [x_diff, y_diff];

  return data;
};

/**
 * Indicates whether a point belongs to a polygon.
 *
 * @param {Array<{x: number, y: number}>} polygon - Polygon defined as a collection of vertices
 * @param {number} verticesNum - Number of vertices in polygon
 * @param {{x: number, y: number}} point - Point
 * @returns {boolean} - True if the point lies inside the polygon; false otherwise
 */
const isInside = (
  polygon: PolygonData,
  verticesNum: number,
  point: Coordinate2D,
): boolean => {
  // There must be at least 3 vertices in polygon[]
  if (verticesNum < 3) {
    return false;
  }

  // Create a point for line segment from p to infinite
  const extreme = {
    x: 99999,
    y: point.y,
  };

  // Count intersections of the above line
  // with sides of polygon
  let count = 0,
    i = 0;
  do {
    const next = (i + 1) % verticesNum;
    // Check if the line segment from 'p' to 'extreme' intersects with the line segment from 'polygon[i]' to 'polygon[next]'
    if (doIntersect(polygon[i], polygon[next], point, extreme)) {
      // If the point 'p' is co-linear with line segment 'i-next', then check if it lies on segment. If it lies, return true, otherwise false
      if (orientation(polygon[i], point, polygon[next]) == 0) {
        return onSegment(polygon[i], point, polygon[next]);
      }
      count++;
    }
    i = next;
  } while (i != 0);

  // Return true if count is odd, false otherwise
  return count % 2 == 1; // Same as (count%2 == 1)
};

/**
 * Provides the orientation for a triplet of points
 *
 * @param p - First point
 * @param q - Second point
 * @param r - Third point
 * @returns {number} -  0 when p, q and r are co-linear; 1 when clockwise; 2 when Counterclockwise
 */
const orientation = (
  p: Coordinate2D,
  q: Coordinate2D,
  r: Coordinate2D,
): number => {
  const val = (q.y - p.y) * (r.x - q.x) - (q.x - p.x) * (r.y - q.y);

  if (val == 0) {
    return 0; // coLinear
  }
  return val > 0 ? 1 : 2; // clock or counter-clock wise
};

/**
 * Indicates whether two segments intersect
 *
 * @param  p1 - Start point of the first segment
 * @param  q1 - End point of the first segment
 * @param  p2 - Start point of the second segment
 * @param  q2 - End point of the second segment
 * @returns {boolean} - True if the first segment intersects the second one
 */
const doIntersect = (
  p1: Coordinate2D,
  q1: Coordinate2D,
  p2: Coordinate2D,
  q2: Coordinate2D,
): boolean => {
  // Find the four orientations needed for general and special cases

  const o1 = orientation(p1, q1, p2);
  const o2 = orientation(p1, q1, q2);
  const o3 = orientation(p2, q2, p1);
  const o4 = orientation(p2, q2, q1);

  // General case
  if (o1 != o2 && o3 != o4) {
    return true;
  }

  // Special Cases
  // p1, q1 and p2 are co-linear and p2 lies on segment p1q1
  if (o1 == 0 && onSegment(p1, p2, q1)) {
    return true;
  }

  // p1, q1 and p2 are co-linear and q2 lies on segment p1q1
  if (o2 == 0 && onSegment(p1, q2, q1)) {
    return true;
  }

  // p2, q2 and p1 are co-linear and p1 lies on segment p2q2
  if (o3 == 0 && onSegment(p2, p1, q2)) {
    return true;
  }

  // p2, q2 and q1 are co-linear and q1 lies on segment p2q2
  if (o4 == 0 && onSegment(p2, q1, q2)) {
    return true;
  }

  // Doesn't fall in any of the above cases
  return false;
};

/**
 * Indicates if a point lies on a line segment defined by two other points
 *
 * @param p - Start point of the segment
 * @param q - Point to be checked
 * @param r - End point of the segment
 * @returns {boolean} - True if the checked point lies on the segment; false otherwise
 */
const onSegment = (
  p: Coordinate2D,
  q: Coordinate2D,
  r: Coordinate2D,
): boolean => {
  return (
    q.x <= Math.max(p.x, r.x) &&
    q.x >= Math.min(p.x, r.x) &&
    q.y <= Math.max(p.y, r.y) &&
    q.y >= Math.min(p.y, r.y)
  );
};

/**
 * Renders a polygon mask on a given context
 */
export const renderPolygonMasks = (
  context: CanvasRenderingContext2D,
  polygonCoords: Coordinate2D[],
) => {
  try {
    const index = 0;
    context.beginPath();
    context.moveTo(polygonCoords[index].x, polygonCoords[index].y);
    for (let i = index; i < polygonCoords.length; i++) {
      context.lineTo(polygonCoords[i].x, polygonCoords[i].y);
    }
    context.closePath();
    context.fill();
  } catch (e) {
    console.log(e);
  }
};

/**
 * Renders the binary mask associated with a detection
 *
 */
export const renderBinaryMasks = (binaryMask: number[][], context: CanvasRenderingContext2D, zoom : number) => {
  if (!binaryMask?.length) return;
  else if (binaryMask[0].length === 0) return;

  const baseX = binaryMask[1][0];
  const baseY = binaryMask[1][1];
  const maskWidth = binaryMask[2][0];
  const maskHeight = binaryMask[2][1];
  const pixelData = binaryMask[0];
  context.imageSmoothingEnabled = true;
  for (let y = 0; y < maskHeight; y++)
    for (let x = 0; x < maskWidth; x++) {
      if (pixelData[x + y * maskWidth] === 1) {
        context.fillRect(baseX + x * zoom, baseY + y * zoom, 1, 1);
      }
    }
  context.imageSmoothingEnabled = false;
}
