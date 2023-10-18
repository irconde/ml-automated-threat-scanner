import { cornerstone, cornerstoneTools } from '../csSetup';
import {
  AnnotationMode,
  CornerstoneMode,
  ToolNames,
} from '../../enums/cornerstone';
import { CreatedBoundingBox, PolygonHandles } from '../../models/cornerstone';
import {
  calculateBoundingBox,
  polygonDataToXYArray,
} from './detection.utilities';
import { BoundingBox, Point } from '../../models/detection';

export const VIEWPORTS_CLASSNAME = 'viewportElement';
/**
 * Updates all viewports by calling the cornerstone.updateImage method on each viewport
 */
export const updateCornerstoneViewports = () => {
  // Causes 2 renders
  console.log('update viewport');
  const viewports = document.getElementsByClassName(
    VIEWPORTS_CLASSNAME,
  ) as HTMLCollectionOf<HTMLElement>;

  for (let i = 0; i < viewports.length; i++) {
    cornerstone.updateImage(viewports[i], true);
  }
};

export const getCreatedPolygonFromTool = (
  viewport: HTMLElement,
):
  | {
      bbox: BoundingBox;
      polygonMask: Point[];
    }
  | undefined => {
  const state = cornerstoneTools.getToolState(viewport, ToolNames.Polygon);
  if (!state?.data[0]) return undefined;
  const handles: PolygonHandles = state?.data[0].handles;
  const bbox = calculateBoundingBox(handles.points);
  console.log({ bbox });
  // const bbox = pointsBoxToDimensionsBox(pointsBbox);
  // const area = getBoundingBoxArea(bbox);
  // console.log({ bbox, area });
  // if (area <= 0) return undefined;
  const area = Math.abs(
    (bbox[0] - (bbox[0] + bbox[2])) * (bbox[1] - (bbox[1] + bbox[3])),
  );

  const polygonMask = polygonDataToXYArray(handles.points, bbox);
  return { bbox, polygonMask };
};

/**
 * Returns the state of the bounding box tool
 * @param viewport
 */
export const getCreatedBoundingBoxFromTool = (
  viewport: HTMLElement,
): CreatedBoundingBox | undefined => {
  const state = cornerstoneTools.getToolState(viewport, ToolNames.BoundingBox);
  return state?.data[0];
};

export const resetCornerstoneTool = (
  toolName: ToolNames,
  viewport: HTMLElement,
) => {
  cornerstoneTools.clearToolState(viewport, toolName);
  cornerstoneTools.setToolDisabled(toolName);
  cornerstoneTools.setToolActive('Pan', { mouseButtonMask: 1 });
  cornerstoneTools.setToolActive('ZoomMouseWheel', {});
  cornerstoneTools.setToolActive('ZoomTouchPinch', {});
};

export const setCornerstoneToolActive = (
  toolName: ToolNames,
  toolOptions: {
    cornerstoneMode: CornerstoneMode;
    annotationMode: AnnotationMode;
    updatingAnnotation: boolean;
  },
) => {
  cornerstoneTools.setToolOptions(toolName, toolOptions);

  cornerstoneTools.setToolActive(toolName, {
    mouseButtonMask: 1,
  });
};

/**
 * Called when the side menu visibility is toggled to resize the viewports
 */
export const resizeCornerstoneViewports = () => {
  const viewports = document.getElementsByClassName(
    VIEWPORTS_CLASSNAME,
  ) as HTMLCollectionOf<HTMLElement>;

  for (let i = 0; i < viewports.length; i++) {
    cornerstone.resize(viewports[i]);
  }
};
