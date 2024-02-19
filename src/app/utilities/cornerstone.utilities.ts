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
  calculatePolygonMask,
  polygonDataToXYArray,
} from './detection.utilities';
import { Detection, getDetectionPolygon, Point } from '../../models/detection';
import { DETECTION_STYLE } from '../../enums/detection-styles';
import {
  MovementToolInputState,
  MovementToolOutput,
  PolygonToolPayload,
} from '../../models/cornerstone-tools.types';
import { ViewportNames } from '../../models/viewport';

export const VIEWPORTS_CLASSNAME = 'viewportElement';
/**
 * Updates all viewports by calling the cornerstone.updateImage method on each viewport
 */
export const updateCornerstoneViewports = () => {
  // Causes 2 renders ?
  const viewports = document.getElementsByClassName(
    VIEWPORTS_CLASSNAME,
  ) as HTMLCollectionOf<HTMLElement>;

  for (let i = 0; i < viewports.length; i++) {
    cornerstone.updateImage(viewports[i], true);
  }
};

export const getPolygonFromTool = (
  viewport: HTMLElement,
): PolygonToolPayload | undefined => {
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

export const resetCsToolByViewport = (
  toolName: ToolNames,
  viewport: HTMLElement,
) => {
  cornerstoneTools.clearToolState(viewport, toolName);
  cornerstoneTools.setToolDisabled(toolName);
  cornerstoneTools.setToolOptions(toolName, {
    cornerstoneMode: CornerstoneMode.Selection,
    temporaryLabel: undefined,
    updatingAnnotation: false,
  });
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

export const resetAllViewportsCsTools = () => {
  ViewportNames.forEach((viewpoint) => {
    const viewport = getViewportByViewpoint(viewpoint);
    resetViewportCsTools(viewport);
  });
};

export const resetViewportCsTools = (viewport: HTMLElement) => {
  [ToolNames.BoundingBox, ToolNames.Polygon, ToolNames.Movement].forEach(
    (toolName) => resetCsToolByViewport(toolName, viewport),
  );
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
    updatingAnnotation: true,
  });
  cornerstoneTools.setToolActive(ToolNames.Polygon, {
    mouseButtonMask: 1,
  });
  updateCornerstoneViewports();
};

export const setMovementToolActive = (selectedDetection: Detection) => {
  const polygonMask = getDetectionPolygon(selectedDetection);
  const toolState: MovementToolInputState = {
    handles: {
      start: {
        x: selectedDetection.boundingBox[0],
        y: selectedDetection.boundingBox[1],
      },
      end: {
        x: selectedDetection.boundingBox[0] + selectedDetection.boundingBox[2],
        y: selectedDetection.boundingBox[1] + selectedDetection.boundingBox[3],
      },
    },
    id: selectedDetection.id,
    renderColor: DETECTION_STYLE.SELECTED_COLOR,
    categoryName: selectedDetection.className,
    updatingAnnotation: true,
    polygonCoords: polygonMask ? [structuredClone(polygonMask)] : [],
  };
  const viewport = getViewportByViewpoint(selectedDetection.viewpoint);
  cornerstoneTools.addToolState(viewport, ToolNames.Movement, toolState);

  cornerstoneTools.setToolOptions(ToolNames.Movement, {
    cornerstoneMode: CornerstoneMode.Edition,
    editionMode: EditionMode.Move,
  });

  cornerstoneTools.setToolActive(ToolNames.Movement, {
    mouseButtonMask: 1,
  });

  cornerstone.updateImage(viewport, true);
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

export const getMovementToolState = (viewport: HTMLElement) => {
  const toolOutput: MovementToolOutput = cornerstoneTools.getToolState(
    viewport,
    ToolNames.Movement,
  );

  if (!toolOutput) return undefined;
  const { handles, polygonCoords } = toolOutput.data[0];
  const bbox = [
    handles.start.x,
    handles.start.y,
    handles.end.x - handles.start.x,
    handles.end.y - handles.start.y,
  ];
  const calculatedMask: Point[][] = [];
  polygonCoords.forEach((segment) => {
    calculatedMask.push(
      calculatePolygonMask(
        [handles.start.x, handles.start.y, handles.end.x, handles.end.y],
        segment,
      ),
    );
  });

  return { bbox, polygonMask: calculatedMask[0] };
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
