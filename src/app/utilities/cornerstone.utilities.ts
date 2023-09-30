import { cornerstone, cornerstoneTools } from '../csSetup';
import { ToolNames } from '../../enums/cornerstone';
import { CreatedBoundingBox } from '../../models/cornerstone';

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

export const getCreatedBoundingBox = (
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
