import * as cornerstone from "cornerstone-core";
// @ts-ignore
import * as cornerstoneTools from 'cornerstone-tools'
// @ts-ignore
import * as cornerstoneMath from 'cornerstone-math'
// @ts-ignore
import * as cornerstoneWebImageLoader from "cornerstone-web-image-loader";

import * as Hammer from 'hammerjs'

cornerstoneTools.external.cornerstone = cornerstone;
cornerstoneTools.external.cornerstoneMath = cornerstoneMath;
cornerstoneWebImageLoader.external.cornerstone = cornerstone;
cornerstoneTools.external.Hammer = Hammer;



export {cornerstone, cornerstoneTools, cornerstoneMath, Hammer, cornerstoneWebImageLoader}
