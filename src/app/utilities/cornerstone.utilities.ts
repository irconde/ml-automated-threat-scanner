import { cornerstone } from '../csSetup';

export const VIEWPORTS_CLASSNAME = 'viewportElement';
/**
 * Updates all viewports by calling the cornerstone.updateImage method on each viewport
 */
export const updateCornerstoneViewport = () => {
  // Causes 2 renders
  console.log('update viewport');
  const viewports = document.getElementsByClassName(
    VIEWPORTS_CLASSNAME,
  ) as HTMLCollectionOf<HTMLElement>;

  for (let i = 0; i < viewports.length; i++) {
    cornerstone.updateImage(viewports[i], true);
  }
};
