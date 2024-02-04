import {BoundingBox, Coordinate2D, Detection, Point, PolygonData,} from '../../models/detection';
import {PolygonPoint} from '../../models/cornerstone';
import {EditionMode} from '../../enums/cornerstone';
import {getTextLabelSize, hexToCssRgba, limitCharCount,} from './text.utilities';
import {DETECTION_STYLE} from '../../enums/detection-styles';
import {isModeAnyOf} from './cornerstone.utilities';
import randomColor from 'randomcolor';

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
 * Converts [x, y, x_f, y_f] to [x, y, width, height]
 * @param bbox
 */
export const pointsBoxToDimensionsBox = (bbox: BoundingBox): BoundingBox => {
  bbox[2] = bbox[2] - bbox[0];
  bbox[3] = bbox[3] - bbox[1];
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
    // TODO: determine the correct type of polygonXY because right now they aren't compatible
    // @ts-ignore
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
 * @param polygonData - List of handles, i.e., the vertices, of a polygon
 * @param boundingBox - List of bounding box coords
 * @returns {Array<{x: number, y: number, anchor: {top: number, bottom: number, left: number, right: number}}>}
 */
export const polygonDataToXYArray = (
  polygonData: PolygonPoint[],
  boundingBox: BoundingBox,
): Point[] => {
  const xDist = boundingBox[2];
  const yDist = boundingBox[3];
  const points: Point[] = [];
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
export const renderBinaryMasks = (
  binaryMask: number[][],
  context: CanvasRenderingContext2D,
  zoom: number,
) => {
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
};

/**
 * Recalculates the anchor points of a polygon mask
 *
 * @param boundingBox - Bounding box data formatted as [x_start, y_start, x_end, y_end]
 * @param polygonCoords - List of handles, i.e., the vertices, of a polygon
 * @returns Array<Point>
 */
const calculateMaskAnchorPoints = (
  boundingBox: BoundingBox,
  polygonCoords: Array<Point>,
): Array<Point> => {
  const xDist = boundingBox[2] - boundingBox[0];
  const yDist = boundingBox[3] - boundingBox[1];
  polygonCoords.forEach((point) => {
    point.anchor.top = ((boundingBox[3] - point.y) / yDist) * 100;
    point.anchor.bottom = ((point.y - boundingBox[1]) / yDist) * 100;
    point.anchor.left = ((point.x - boundingBox[0]) / xDist) * 100;
    point.anchor.right = ((boundingBox[2] - point.x) / xDist) * 100;
  });
  return polygonCoords;
};

/**
 * Calculates the coordinates of the bounding box for a given polygon
 *
 * @param boundingBox - Bounding box data formatted as [x_start, y_start, x_end, y_end]
 * @param polygonData - List of handles, i.e., the vertices, of a polygon
 * @returns newPolygonData with updated points based on anchor points
 */
export const calculatePolygonMask = (
  boundingBox: BoundingBox,
  polygonData: Array<Point>,
): Array<Point> => {
  let newPolygonData = JSON.parse(JSON.stringify(polygonData)) as Array<Point>;
  const xDist = boundingBox[2] - boundingBox[0];
  const yDist = boundingBox[3] - boundingBox[1];
  newPolygonData.forEach((point) => {
    if (point.anchor.left !== 0 && point.anchor.right !== 0) {
      point.x = boundingBox[0] + (xDist * point.anchor.left) / 100;
    } else if (point.anchor.right === 0) {
      point.x = boundingBox[2];
    } else if (point.anchor.left === 0) {
      point.x = boundingBox[0];
    }
    if (point.anchor.top !== 0 && point.anchor.bottom !== 0) {
      point.y = boundingBox[1] + (yDist * point.anchor.bottom) / 100;
    } else if (point.anchor.bottom === 0) {
      point.y = boundingBox[1];
    } else if (point.anchor.top === 0) {
      point.y = boundingBox[3];
    }
  });
  newPolygonData = calculateMaskAnchorPoints(boundingBox, newPolygonData);
  return newPolygonData;
};

export interface CornerstoneHandle {
  start: number;
  end: number;
  start_prima: number;
  end_prima: number;
  hasMoved: boolean;
  x: number;
  y: number;
}

/**
 * Recalculates the four corners of a rectangle based on the coordinates of the corner being moved
 *
 * @param  cornerList - Rectangle corners' coordinates
 * @returns - Recalculated coordinates
 */
export const recalculateRectangle = (
  cornerList: Record<string, CornerstoneHandle>,
) => {
  const cornerKeys = Object.keys(cornerList);
  let movingCornerKey;
  let movingCornerKeyIndex;
  for (let i = 0; i < cornerKeys.length; i++) {
    if (cornerList[cornerKeys[i]].hasMoved === true) {
      movingCornerKeyIndex = i;
      movingCornerKey = cornerKeys[i];
      break;
    }
  }
  if (movingCornerKey === undefined) {
    return cornerList;
  }

  if (movingCornerKeyIndex === undefined) return;

  const newRectDiagonal = movingCornerKey.includes('start')
    ? [movingCornerKey, cornerKeys[movingCornerKeyIndex + 1]]
    : [cornerKeys[movingCornerKeyIndex - 1], movingCornerKey];

  const secondDiagonalFirstIndex = movingCornerKey.includes('prima') ? 0 : 2;
  cornerList[cornerKeys[secondDiagonalFirstIndex]].x =
    cornerList[newRectDiagonal[0]].x;
  cornerList[cornerKeys[secondDiagonalFirstIndex]].y =
    cornerList[newRectDiagonal[1]].y;
  cornerList[cornerKeys[secondDiagonalFirstIndex + 1]].x =
    cornerList[newRectDiagonal[1]].x;
  cornerList[cornerKeys[secondDiagonalFirstIndex + 1]].y =
    cornerList[newRectDiagonal[0]].y;

  return cornerList;
};

/**
 * Indicates whether a given point is inside a rectangle or not
 *
 * @static
 * @param {Array<number>} point - 2D point defined as a pair of coordinates (x,y)
 * @param {Array<number>} rect - Array that hold four float values representing the two end-points of a rectangle's
 *     diagonal
 * @returns {boolean} - True if the point is inside the rectangle; false otherwise
 */
export const pointInRect = (point: Coordinate2D, rect: number[]) => {
  // [x0, y0, width, height]
  // [0, 1, 2, 3]
  return (
    point.x >= rect[0] &&
    point.x <= rect[0] + rect[2] &&
    point.y >= rect[1] &&
    point.y <= rect[1] + rect[3]
  );
};

/**
 * Given a cornerstone detection handles object, it returns the bounding box
 * @param start
 * @param end
 * @returns bbox - [x, y, width, height]
 */
export const getBboxFromHandles = ({
  start,
  end,
}: {
  start: Coordinate2D;
  end: Coordinate2D;
}): BoundingBox => {
  // Fix flipped rectangle issues
  let bbox: BoundingBox;
  if (start.x > end.x && start.y > end.y) {
    bbox = [end.x, end.y, start.x, start.y];
  } else if (start.x > end.x) {
    bbox = [end.x, start.y, start.x, end.y];
  } else if (start.y > end.y) {
    bbox = [start.x, end.y, end.x, start.y];
  } else {
    bbox = [start.x, start.y, end.x, end.y];
  }

  return pointsBoxToDimensionsBox(bbox);
};

/**
 * Determines the area of a given bounding box
 * @param bbox - [x, y, width, height]
 */
export const getBoundingBoxArea = (bbox: BoundingBox): number => {
  return bbox[2] * bbox[3];
};

export const displayDetection = (
  context: CanvasRenderingContext2D,
  detection: Detection,
  anyDetectionSelected: boolean,
  editionMode: EditionMode,
  zoom: number,
) => {
  if (
    !detection.visible ||
    (detection.selected &&
      isModeAnyOf(
        editionMode,
        EditionMode.Bounding,
        EditionMode.Polygon,
        EditionMode.Move,
      ))
  ) {
    return;
  }

  const renderColor = getDetectionRenderColor(detection, anyDetectionSelected);
  context.strokeStyle = renderColor;
  context.fillStyle = renderColor;

  const [x, y, w, h] = detection.boundingBox;

  context.strokeRect(x, y, w, h);

  context.globalAlpha = 0.5;
  if ('polygonMask' in detection && detection.polygonMask?.length) {
    renderPolygonMasks(context, detection.polygonMask);
  } else if (detection.binaryMask) {
    renderBinaryMasks(detection.binaryMask, context, zoom);
  }

  context.globalAlpha = 1.0;

  renderDetectionLabel(context, detection, zoom);
};

/**
 * Draws the detection label with the font size based on the zoom level
 */
export const renderDetectionLabel = (
  context: CanvasRenderingContext2D,
  detection: Detection,
  zoom: number,
) => {
  const labelText = limitCharCount(detection.className);
  const { LABEL_PADDING, LABEL_HEIGHT } = DETECTION_STYLE;
  const { width, height } = getTextLabelSize(
    context,
    labelText,
    LABEL_PADDING.LEFT,
    zoom,
    LABEL_HEIGHT,
  );

  const [x, y] = detection.boundingBox;
  context.fillRect(x - context.lineWidth / 2, y - height, width, height);
  context.fillStyle = DETECTION_STYLE.LABEL_TEXT_COLOR;
  context.fillText(
    labelText,
    x + (LABEL_PADDING.LEFT - 1) / zoom,
    y - LABEL_PADDING.BOTTOM / zoom,
  );
};

/**
 * Returns the detection color based on whether it's selected, or another detection is selected
 */
export const getDetectionRenderColor = (
  detection: Detection,
  anyDetectionSelected: boolean,
): string => {
  if (detection.selected) {
    return DETECTION_STYLE.SELECTED_COLOR;
  } else if (anyDetectionSelected) {
    return hexToCssRgba(detection.color);
  } else return detection.color;
};

/**
 * Calculates the coordinates of the bounding box enclosing a given polygon
 *
 * @param polygonData - List of handles, i.e., the vertices, of a polygon
 * @returns bounding box - New bounding box coordinates in form of [x_min, y_min, width, height].
 */
export const calculateBoundingBox = (
  polygonData: PolygonPoint[],
): BoundingBox => {
  const x_values: number[] = [];
  const y_values: number[] = [];
  for (const index in polygonData) {
    x_values.push(polygonData[index].x);
    y_values.push(polygonData[index].y);
  }
  const x_min = Math.min(...x_values);
  const y_max = Math.max(...y_values);
  const x_max = Math.max(...x_values);
  const y_min = Math.min(...y_values);
  return [x_min, y_min, x_max - x_min, y_max - y_min];
};

export const generateDetectionColor = (className: string): string => {
  return randomColor({
    seed: className.toLowerCase(),
    hue: 'random',
    luminosity: 'bright',
  });
};
