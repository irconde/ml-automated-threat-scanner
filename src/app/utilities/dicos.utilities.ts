import dicomParser from 'dicom-parser';

export const DICOS_DICTIONARY = {
  ThreatROIBase: {
    tag: 'x40101004',
    name: 'ThreatROIBase',
  },
  ThreatROIExtents: {
    tag: 'x40101005',
    name: 'ThreatROIExtents',
  },
  ThreatROIBitmap: {
    tag: 'x40101006',
    name: 'ThreatROIBitmap',
  },
  BoundingPolygon: {
    tag: 'x4010101d',
    name: 'BoundingPolygon',
  },
  ThreatCategoryDescription: {
    tag: 'x40101013',
    name: 'ThreatCategoryDescription',
  },
  ATDAssessmentProbability: {
    tag: 'x40101016',
    name: 'ATDAssessmentProbability',
  },
  NumberOfAlarmObjects: {
    tag: 'x40101034',
    name: 'NumberOfAlarmObjects',
  },
  ThreatDetectionAlgorithmandVersion: {
    tag: 'x40101029',
    name: 'ThreatDetectionAlgorithmandVersion',
  },
  DetectorType: {
    tag: 'x00187004',
    name: 'DetectorType',
  },
  DetectorConfiguration: {
    tag: 'x00187005',
    name: 'DetectorConfiguration',
  },
  StationName: {
    tag: 'x00081010',
    name: 'StationName',
  },
  SeriesDescription: {
    tag: 'x0008103e',
    name: 'SeriesDescription',
  },
  StudyDescription: {
    tag: 'x00081030',
    name: 'StudyDescription',
  },
};

/**
 * Parses a DICOS+TDR file to pull the coordinates of the bounding boxes to be rendered
 *
 * @param {Blob} image - Blob data
 * @return {Array<number>} - Coordinates of the several bounding boxes derived from the DICOS+TDR data. Each
 * bounding box is defined by the two end points of the diagonal, and each point is defined by its coordinates x and y.
 */
export const retrieveBoundingBoxData = (
  image: dicomParser.Element
): number[] => {
  const BYTES_PER_FLOAT = 4;
  const B_BOX_POINT_COUNT = 2;

  const bBoxDataSet =
    image.dataSet?.elements['x40101037']?.items?.at(0)?.dataSet;

  if (bBoxDataSet?.elements === undefined)
    throw Error('Missing bounding box for detection');

  const bBoxByteArraySize =
    bBoxDataSet.elements[DICOS_DICTIONARY['BoundingPolygon'].tag].length;
  const bBoxBytesCount = bBoxByteArraySize / BYTES_PER_FLOAT;
  // NOTE: The z component is not necessary, so we get rid of the third component in every trio of values
  const bBoxComponentsCount = (B_BOX_POINT_COUNT * bBoxBytesCount) / 3;
  const bBoxCoords = new Array(bBoxComponentsCount);
  let bBoxIndex = 0;
  let componentCount = 0;

  for (let i = 0; i < bBoxBytesCount; i++, componentCount++) {
    if (componentCount === B_BOX_POINT_COUNT) {
      componentCount = -1;
      continue;
    }
    bBoxCoords[bBoxIndex] = bBoxDataSet.float(
      DICOS_DICTIONARY['BoundingPolygon'].tag,
      i
    );
    bBoxIndex++;
  }
  return bBoxCoords;
};

/**
 * Parses a DICOS+TDR file to retrieve the class of the potential threat object
 *
 * @param image - Dicom element
 * @returns Description of the potential threat object
 */
export const retrieveObjectClass = (image: dicomParser.Element): string => {
  const firstItem = image.dataSet?.elements['x40101038']?.items?.at(0);
  const className = firstItem?.dataSet?.string(
    DICOS_DICTIONARY['ThreatCategoryDescription'].tag
  );
  if (className) return className;
  else throw Error("Missing required field 'className'");
};

/**
 * Converts a decimal value into a percentage
 *
 * @param {number} num Float value <= 1.0 with common decimal format
 * @returns {number} Percentage equivalent to the given input float value
 */
export const decimalToPercentage = (num: number): number => {
  return Math.floor(num * 100);
};

/**
 * Parses a DICOS+TDR file to retrieve the confidence level of the detection algorithm used
 *
 * @param image - Dicom element
 * @returns {number} - Confidence level
 */
export const retrieveConfidenceLevel = (image: dicomParser.Element): number => {
  const items = image.dataSet?.elements['x40101038']?.items;
  const confidenceTag = DICOS_DICTIONARY.ATDAssessmentProbability.tag;
  const confidence = items?.at(0)?.dataSet?.float(confidenceTag);
  if (confidence) return confidence;
  else throw Error('Missing required confidence parameter');
};

/**
 * Parses a DICOS+TDR file to pull the bitmap mask data
 *
 * @param image - DICOS+TDR image data
 * @param data - DICOS+TDR pixel data
 * @returns {Array<number>} - Bitmap mask data
 *
 */
export const retrieveMaskData = (
  image: dicomParser.Element,
  data: dicomParser.DataSet
): undefined | [number[], number[], number[]] => {
  const dataSet = image.dataSet;
  if (dataSet === undefined) return;
  const dicomElem =
    dataSet.elements['x40101037'].items?.at(0)?.dataSet?.elements['x40101001'];
  if (dicomElem === undefined) return;
  const baseDataSet = dicomElem.items?.at(0)?.dataSet;
  if (baseDataSet?.elements === undefined) return;

  const baseByteArraySize =
    baseDataSet.elements[DICOS_DICTIONARY.ThreatROIBase.tag].length;
  const BYTES_PER_FLOAT = 4;
  const B_BOX_POINT_COUNT = 2;
  const bBoxBytesCount = baseByteArraySize / BYTES_PER_FLOAT;
  // NOTE: The z component is not necessary, so we get rid of the third component in every trio of values
  const bBoxComponentsCount = (B_BOX_POINT_COUNT * bBoxBytesCount) / 3;
  const baseCoords = new Array(bBoxComponentsCount);
  let bBoxIndex = 0;
  let componentCount = 0;

  for (let i = 0; i < bBoxBytesCount; i++, componentCount++) {
    if (componentCount === B_BOX_POINT_COUNT) {
      componentCount = -1;
      continue;
    }
    baseCoords[bBoxIndex] = baseDataSet.float(
      DICOS_DICTIONARY.ThreatROIBase.tag,
      i
    );
    bBoxIndex++;
  }

  const extentsByteArraySize =
    baseDataSet.elements[DICOS_DICTIONARY.ThreatROIExtents.tag].length;
  const extentsBytesCount = extentsByteArraySize / BYTES_PER_FLOAT;
  // NOTE: The z component is not necessary, so we get rid of the third component in every trio of values
  const extentsComponentsCount = (B_BOX_POINT_COUNT * extentsBytesCount) / 3;
  const extentsCoords = new Array(extentsComponentsCount);
  bBoxIndex = 0;
  componentCount = 0;

  for (let j = 0; j < extentsBytesCount; j++, componentCount++) {
    if (componentCount === B_BOX_POINT_COUNT) {
      componentCount = -1;
      continue;
    }
    extentsCoords[bBoxIndex] = baseDataSet.float(
      DICOS_DICTIONARY.ThreatROIExtents.tag,
      j
    );
    bBoxIndex++;
  }
  let arrayPixelData: any[] = [];

  const pixelDataElement = baseDataSet.elements['x40101006'];
  if (pixelDataElement !== undefined) {
    const pixelData = new Uint8Array(
      data.byteArray.buffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length
    );
    arrayPixelData = Array.from(pixelData);
  }
  return [arrayPixelData, baseCoords, extentsCoords];
};
