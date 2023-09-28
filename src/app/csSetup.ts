import * as cornerstone from 'cornerstone-core';
// @ts-ignore
import * as cornerstoneTools from 'eac-cornerstone-tools';
// @ts-ignore
import * as cornerstoneMath from 'cornerstone-math';
// @ts-ignore
import * as cornerstoneWebImageLoader from 'cornerstone-web-image-loader';
// @ts-ignore
import * as cornerstoneWADOImageLoader from 'cornerstone-wado-image-loader';

import * as Hammer from 'hammerjs';
import dicomParser from 'dicom-parser';

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneTools.init({
  mouseEnabled: true,
  touchEnabled: true,
});
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.cornerstone = cornerstone;
cornerstoneWADOImageLoader.external.dicomParser = dicomParser;
cornerstoneWADOImageLoader.webWorkerManager.initialize({
  maxWebWorkers: navigator.hardwareConcurrency || 1,
  startWebWorkersOnDemand: true,
  taskConfiguration: {
    decodeTask: {
      initializeCodecsOnStartup: false,
      usePDFJS: false,
      strict: false,
    },
  },
});

export {
  cornerstone,
  cornerstoneTools,
  cornerstoneMath,
  Hammer,
  cornerstoneWebImageLoader,
  cornerstoneWADOImageLoader,
};
