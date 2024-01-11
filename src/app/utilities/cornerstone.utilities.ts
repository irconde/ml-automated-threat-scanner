import { cornerstone, cornerstoneTools } from '../csSetup';
import {
  AnnotationMode,
  CornerstoneMode,
  EditionMode,
  ToolNames,
} from '../../enums/cornerstone';
import { CreatedBoundingBox, PolygonHandles } from '../../models/cornerstone';
import {
  calculateBoundingBox,
  polygonDataToXYArray,
} from './detection.utilities';
import { BoundingBox, Detection, Point } from '../../models/detection';
import { DETECTION_STYLE } from '../../enums/detection-styles';

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

export const resetCornerstoneTools = (viewport: HTMLElement) => {
  cornerstoneTools.setToolDisabled(ToolNames.BoundingBox);
  cornerstoneTools.setToolDisabled(ToolNames.Polygon);
  cornerstoneTools.setToolDisabled(ToolNames.AnnotationMovement);

  cornerstoneTools.clearToolState(viewport, ToolNames.BoundingBox);
  cornerstoneTools.clearToolState(viewport, ToolNames.Polygon);
  cornerstoneTools.clearToolState(viewport, ToolNames.AnnotationMovement);

  cornerstoneTools.setToolOptions(ToolNames.BoundingBox, {
    cornerstoneMode: CornerstoneMode.Selection,
    temporaryLabel: undefined,
  });
  cornerstoneTools.setToolOptions(ToolNames.Polygon, {
    cornerstoneMode: CornerstoneMode.Selection,
    temporaryLabel: undefined,
    updatingAnnotation: false,
  });
  cornerstoneTools.setToolOptions(ToolNames.AnnotationMovement, {
    cornerstoneMode: CornerstoneMode.Annotation,
    temporaryLabel: undefined,
  });

  cornerstoneTools.setToolActive(ToolNames.Pan, { mouseButtonMask: 1 });
  cornerstoneTools.setToolActive(ToolNames.ZoomMouseWheel, {});
  cornerstoneTools.setToolActive(ToolNames.ZoomTouchPinch, {});
};

export const setPolygonEditToolActive = (
  selectedDetection: Detection,
): false | void => {
  const hasPolygon =
    'polygonMask' in selectedDetection &&
    selectedDetection.polygonMask !== undefined;
  if (!hasPolygon) return false;
  const viewport = getViewportByViewpoint(selectedDetection.viewpoint);
  const toolState = {
    handles: {
      points: selectedDetection.polygonMask,
    },
    id: selectedDetection.id,
    renderColor: DETECTION_STYLE.SELECTED_COLOR,
    updatingAnnotation: true,
  };
  cornerstoneTools.addToolState(viewport, ToolNames.Polygon, toolState);
  cornerstoneTools.setToolOptions(ToolNames.Polygon, {
    cornerstoneMode: CornerstoneMode.Edition,
    editionMode: EditionMode.Polygon,
    updatingDetection: true,
  });
  cornerstoneTools.setToolActive(ToolNames.Polygon, {
    mouseButtonMask: 1,
  });
  updateCornerstoneViewports();
};

export const setBoundingEditToolActive = (selectedDetection: Detection) => {
  // resetCornerstoneTool()
  // bbox = [x_0, y_0, w, h]
  const [x_0, y_0, width, height] = selectedDetection.boundingBox;
  const data = {
    handles: {
      // Top left
      start: {
        x: x_0,
        y: y_0,
      },
      // Bottom Right
      end: {
        x: x_0 + width,
        y: y_0 + height,
      },
      // Bottom Left
      start_prima: {
        x: x_0,
        y: y_0 + height,
      },
      // Top Right
      end_prima: {
        x: x_0 + width,
        y: y_0,
      },
    },
    id: selectedDetection.uuid,
    categoryName: selectedDetection.categoryName,
    algorithm: selectedDetection.algorithm,
    class: selectedDetection.className,
    renderColor: DETECTION_STYLE.SELECTED_COLOR,
    confidence: selectedDetection.confidence,
    updatingDetection: true,
    view: selectedDetection.viewpoint,
    segmentation:
      'polygonMask' in selectedDetection
        ? structuredClone(selectedDetection.polygonMask)
        : undefined,
    binaryMask: selectedDetection.binaryMask,
  };

  const viewport = getViewportByViewpoint(selectedDetection.viewpoint);
  cornerstoneTools.addToolState(viewport, ToolNames.BoundingBox, data);

  cornerstoneTools.setToolActive(ToolNames.BoundingBox, {
    mouseButtonMask: 1,
  });
  cornerstoneTools.setToolActive(ToolNames.Pan, {
    mouseButtonMask: 1,
  });
  cornerstoneTools.setToolOptions(ToolNames.BoundingBox, {
    cornerstoneMode: CornerstoneMode.Edition,
    editionMode: EditionMode.Bounding,
  });

  updateCornerstoneViewports();
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

export const getViewportByViewpoint = (viewpoint: string): HTMLElement => {
  const viewport = document.getElementsByClassName(viewpoint)[0] as HTMLElement;
  if (viewport) return viewport;
  else throw Error(`Viewpoint ${viewpoint} is unknown`);
};

/**
 * Given a variable as a first argument, it returns true if any of the rest of arguments match the first argument
 * @param mode
 * @param args
 */
export const isModeAnyOf = <T>(mode: T, ...args: T[]) => args.includes(mode);
