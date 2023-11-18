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

export const setBoundingEditToolActive = (selectedDetection: Detection) => {
  // resetCornerstoneTool()
  const data = {
    handles: {
      start: {
        x: selectedDetection.boundingBox[0],
        y: selectedDetection.boundingBox[1],
      },
      end: {
        x: selectedDetection.boundingBox[2],
        y: selectedDetection.boundingBox[3],
      },
      start_prima: {
        x: selectedDetection.boundingBox[0],
        y: selectedDetection.boundingBox[3],
      },
      end_prima: {
        x: selectedDetection.boundingBox[2],
        y: selectedDetection.boundingBox[1],
      },
    },
    uuid: selectedDetection.uuid,
    algorithm: selectedDetection.algorithm,
    class: selectedDetection.className,
    renderColor: DETECTION_STYLE.SELECTED_COLOR,
    confidence: selectedDetection.confidence,
    updatingDetection: true,
    view: selectedDetection.viewpoint,
    polygonCoords:
      'polygonMask' in selectedDetection
        ? selectedDetection.polygonMask
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
  cornerstoneTools.setToolOptions('BoundingBoxDrawing', {
    cornerstoneMode: CornerstoneMode.Edition,
    editionMode: EditionMode.NoTool,
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

export const getViewportByViewpoint = (viewpoint: string): HTMLElement => {
  const viewport = document.getElementsByClassName(viewpoint)[0] as HTMLElement;
  if (viewport) return viewport;
  else throw Error(`Viewpoint ${viewpoint} is unknown`);
};
