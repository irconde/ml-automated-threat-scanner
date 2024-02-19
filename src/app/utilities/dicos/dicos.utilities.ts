import dicomParser from 'dicom-parser';
import { Detection, DetectionType } from '../../../models/detection';
import JSZip from 'jszip';
import { PixelData } from '../../../models/file-parser';
import { cornerstone } from '../../csSetup';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore
import * as dcmjs from 'dcmjs';
import { getViewportByViewpoint } from '../cornerstone.utilities';
import { buildDicosObject } from './dicosBaseObject';

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
 * It's assumed the file stores the bounding box as [x_0, y_0, x_f, y_f]
 *
 * @param {Blob} image - Blob data
 * @return {Array<number>} - Coordinates of the several bounding boxes derived from the DICOS+TDR data. Each
 * bounding box is defined by the two end points of the diagonal, and each point is defined by its coordinates x and y
 * [x_0, y_0, w, h]
 */
export const retrieveBoundingBoxData = (
  image: dicomParser.Element,
): number[] => {
  const BYTES_PER_FLOAT = 4;
  const B_BOX_POINT_COUNT = 2;

  const bBoxDataSet = image.dataSet?.elements['x40101037']?.items?.[0]?.dataSet;

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
      i,
    );
    bBoxIndex++;
  }

  bBoxCoords[2] = Math.abs(bBoxCoords[2] - bBoxCoords[0]);
  bBoxCoords[3] = Math.abs(bBoxCoords[3] - bBoxCoords[1]);

  return bBoxCoords;
};

/**
 * Parses a DICOS+TDR file to retrieve the class of the potential threat object
 *
 * @param image - Dicom element
 * @returns Description of the potential threat object
 */
export const retrieveObjectClass = (image: dicomParser.Element): string => {
  const firstItem = image.dataSet?.elements['x40101038']?.items?.[0];
  const className = firstItem?.dataSet?.string(
    DICOS_DICTIONARY['ThreatCategoryDescription'].tag,
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
  const confidence = items?.[0]?.dataSet?.float(confidenceTag);
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
  data: dicomParser.DataSet,
): undefined | [number[], number[], number[]] => {
  const dataSet = image.dataSet;
  if (dataSet === undefined) return;
  const dicomElem =
    dataSet.elements['x40101037'].items?.[0]?.dataSet?.elements['x40101001'];
  if (dicomElem === undefined) return;
  const baseDataSet = dicomElem.items?.[0]?.dataSet;
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
      i,
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
      j,
    );
    bBoxIndex++;
  }
  let arrayPixelData: any[] = [];

  const pixelDataElement = baseDataSet.elements['x40101006'];
  if (pixelDataElement !== undefined) {
    const pixelData = new Uint8Array(
      data.byteArray.buffer,
      pixelDataElement.dataOffset,
      pixelDataElement.length,
    );
    arrayPixelData = Array.from(pixelData);
  }
  return [arrayPixelData, baseCoords, extentsCoords];
};

/**
 * Returns the base64 string file on success
 * @param imageData
 * @param currentFileFormat
 * @param detections
 * @param fileType
 * @throws error
 */
export const generateDicosOutput = async (
  imageData: PixelData[],
  currentFileFormat: DetectionType,
  detections: Detection[],
  fileType: 'base64' | 'blob',
): Promise<string | Blob> => {
  const stackXML = document.implementation.createDocument('', '', null);
  const prolog = '<?xml version="1.0" encoding="utf-8"?>';
  const imageElem = stackXML.createElement('image');
  imageElem.setAttribute('format', DetectionType.TDR);
  const mimeType = new Blob(['image/openraster'], {
    type: 'text/plain;charset=utf-8',
  });
  const newOra = new JSZip();
  // TODO: figure out if compression should be 'STORE' or 'DEFLATE'
  newOra.file('mimetype', mimeType, { compression: 'STORE' });
  let stackCounter = 1;
  let detectionId = 1;
  const listOfPromises: Promise<Blob>[] = [];
  imageData.forEach((image) => {
    const stackElem = stackXML.createElement('stack');
    stackElem.setAttribute('name', `SOP Instance UID #${stackCounter}`);
    stackElem.setAttribute('view', image.viewpoint);
    const pixelLayer = stackXML.createElement('layer');
    // We always know the first element in the stack.blob data is pixel element
    pixelLayer.setAttribute('src', `data/${image.viewpoint}_pixel_data.dcs`);
    if (currentFileFormat === DetectionType.TDR) {
      newOra.file(`data/${image.viewpoint}_pixel_data.dcs`, image.pixelData);
    } else if (currentFileFormat === DetectionType.COCO) {
      const viewport = getViewportByViewpoint(image.viewpoint);
      const tdrPromise = pngToDicosPixelData(viewport);
      tdrPromise
        .then((blob) => {
          newOra.file(`data/${image.viewpoint}_pixel_data.dcs`, blob);
        })
        .catch((error) => {
          console.log(error);
        });
      listOfPromises.push(tdrPromise);
    }
    stackElem.appendChild(pixelLayer);

    detections
      .filter((det) => det.viewpoint === image.viewpoint)
      .forEach((detection) => {
        const threatPromise = detectionObjectToBlob(
          detection,
          image.pixelData as Blob,
          currentFileFormat,
        );
        threatPromise
          .then((threatBlob) => {
            newOra.file(
              `data/${detection.viewpoint}_threat_detection_${detectionId}.dcs`,
              threatBlob,
            );
            const newLayer = stackXML.createElement('layer');
            newLayer.setAttribute(
              'src',
              `data/${detection.viewpoint}_threat_detection_${detectionId}.dcs`,
            );
            stackElem.appendChild(newLayer);
            detectionId++;
          })
          .catch((error) => {
            // TODO: handle error here
            console.warn(error);
          });
        listOfPromises.push(threatPromise);
      });

    stackCounter++;
    imageElem.appendChild(stackElem);
  });

  await Promise.all(listOfPromises);
  stackXML.appendChild(imageElem);
  newOra.file(
    'stack.xml',
    new Blob([prolog + new XMLSerializer().serializeToString(stackXML)], {
      type: 'application/xml ',
    }),
  );
  return await newOra.generateAsync({ type: fileType });
};

const pngToDicosPixelData = async (viewport: HTMLElement) => {
  const buildIntervals = () => {
    const intervals = [{ min: 0, max: 255 }];
    for (let i = 255; i < 65535; i += 256) {
      intervals.push({ min: i, max: i + 256 });
    }
    return intervals;
  };

  const image = cornerstone.getImage(viewport);
  const pixelData = image.getPixelData();
  const buffer = new ArrayBuffer(2 * image.width * image.height);
  const sixteenBitPixels = new Uint16Array(buffer);
  let z = 0;
  const intervals = buildIntervals();
  for (let i = 0; i < pixelData.length; i += 4) {
    // R, G, and B values should all be the same, so just pull the R value.
    const interval = intervals[pixelData[i]];
    // calculate the average value
    sixteenBitPixels[z] = Math.floor((interval.min + interval.max) / 2);
    z++;
  }
  return pixelDataToBlob(sixteenBitPixels, image.width, image.height);
};

/**
 * Converts a Uint16Array of 16-bit unsigned greyscale pixel data into a standard P10 DICOM object to be returned as a blob.
 */
const pixelDataToBlob = (
  pixelData: Uint16Array,
  width: number,
  height: number,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      const jsonDataset = `{
                    "AccessionNumber": "",
                    "AcquisitionContextSequence": {
                        "ConceptNameCodeSequence": {
                            "CodeMeaning": "0",
                            "CodingSchemeDesignator": "0",
                            "CodeValue": "0"
                        }
                    },
                    "AcquisitionDate": "19700101",
                    "AcquisitionTime": "000000",
                    "AcquisitionDateTime": "19700101000000",
                    "AcquisitionNumber": "0",
                    "AcquisitionStatus": "SUCCESSFUL",
                    "BeltHeight": 0,
                    "BitsAllocated": 16,
                    "BitsStored": 16,
                    "BurnedInAnnotation": "NO",
                    "Columns": ${width},
                    "ContentDate": "19700101",
                    "ContentTime": "000000",
                    "DateOfLastCalibration": "19700101",
                    "DetectorConfiguration": "SLOT",
                    "DetectorDescription": "DetectorDesc",
                    "DetectorGeometrySequence": {
                        "DistanceSourceToDetector": "0.0",
                        "SourceOrientation": [1,1,1],
                        "SourcePosition": [1,1,1]
                    },
                    "DetectorType": "DIRECT",
                    "DeviceSerialNumber": "0000",
                    "DICOSVersion": "V02A",
                    "DistanceSourceToDetector": "0",
                    "HighBit": 15,
                    "ImageOrientationPatient": [ "1", "0", "0", "0", "1", "0" ],
                    "ImagePositionPatient": [ "1", "1", "1" ],
                    "ImageType": [ "ORIGINAL", "PRIMARY", "VOLUME", "NONE"],
                    "InstanceCreationDate": "19700101",
                    "InstanceCreationTime": "000000",
                    "InstanceNumber": "1465259664581492288628588272875781878935",
                    "InstitutionAddress": "2805 Columbia St, Torrance, CA 90503 U.S.A.",
                    "InstitutionName": "Rapiscan Systems",
                    "IssuerOfPatientID": "Rapiscan Systems",
                    "KVP": "0",
                    "LossyImageCompression": "00",
                    "Manufacturer": "Rapiscan Systems",
                    "ManufacturerModelName": "unknown",
                    "Modality": "DX",
                    "NumberOfFrames": "1",
                    "OOIOwnerType": "OwnerType",
                    "OOISize": [1,1,1],
                    "OOIType": "BAGGAGE",
                    "PatientBirthDate": "unknown",
                    "PatientID": "unknown",
                    "PatientName": "unknown",
                    "PatientSex": "U",
                    "PhotometricInterpretation": "MONOCHROME2",
                    "PixelIntensityRelationship": "LIN",
                    "PixelIntensityRelationshipSign": 1,
                    "PixelRepresentation": 0,
                    "PlanarConfiguration": 0,
                    "PresentationIntentType": "FOR PROCESSING",
                    "PresentationLUTShape": "IDENTITY",
                    "RescaleIntercept": "0",
                    "RescaleSlope": "1",
                    "RescaleType": "HU",
                    "Rows": ${height},
                    "ScanType": "OPERATIONAL",
                    "SOPClassUID": "1.2.840.10008.5.1.4.1.1.501.2.1",
                    "SOPInstanceUID": "1.2.276.0.7230010.3.1.4.8323329.1130.1596485298.771161",
                    "SamplesPerPixel": 1,
                    "SeriesDate": "19700101",
                    "SeriesDescription": "unknown",
                    "SeriesInstanceUID": "1.2.276.0.7230010.3.1.4.8323329.1130.1596485298.771163",
                    "SeriesTime": "000000",
                    "SoftwareVersions": "0000",
                    "StationName": "unknown",
                    "StudyDate": "19700101",
                    "StudyDescription": "Malibu v1.0",
                    "StudyID": "Malibu v1.0",
                    "StudyInstanceUID": "1.2.276.0.7230010.3.1.4.8323329.1130.1596485298.771162",
                    "StudyTime": "000000",
                    "TableSpeed": 1,
                    "TimeOfLastCalibration": "000000",
                    "TypeOfPatientID": "TEXT",
                    "XRayTubeCurrentInuA": "0",
                    "_meta": {
                        "FileMetaInformationVersion": {
                            "Value": [
                                {
                                    "0": 0,
                                    "1": 1
                                }
                            ],
                            "vr": "OB"
                        },
                        "ImplementationClassUID": {
                            "Value": [
                                "1.2.276.0.7230010.3.0.3.6.4"
                            ],
                            "vr": "UI"
                        },
                        "ImplementationVersionName": {
                            "Value": [
                                "OFFIS_DCMTK_364"
                            ],
                            "vr": "SH"
                        },
                        "MediaStorageSOPClassUID": {
                            "Value": [
                                "1.2.840.10008.5.1.4.1.1.501.2.1"
                            ],
                            "vr": "UI"
                        },
                        "MediaStorageSOPInstanceUID": {
                            "Value": [
                                "1.2.276.0.7230010.3.1.4.8323329.1137.1596498070.943683"
                            ],
                            "vr": "UI"
                        },
                        "TransferSyntaxUID": {
                            "Value": [
                                "1.2.840.10008.1.2.1"
                            ],
                            "vr": "UI"
                        }
                    },
                    "_vrMap": {
                        "PixelData": "OW"
                    }
                }`;

      const dataset = JSON.parse(jsonDataset);

      dataset.PixelData = pixelData.buffer;

      // Create the Dicom Dictionary file
      const dicomDict = dcmjs.data.datasetToDict(dataset);

      // Create the buffer from the denaturalized data set populated above
      const new_file_WriterBuffer = dicomDict.write();

      // Create a blob with this buffer
      const file = new Blob([new_file_WriterBuffer], {
        type: 'image/dcs',
      });
      resolve(file);
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Converts a detection and its parent image into blob data with DICOM format
 */
const detectionObjectToBlob = (
  detection: Detection,
  data: Blob,
  currentFileFormat: DetectionType,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      getInstanceNumber(data, currentFileFormat).then((instanceNumber) => {
        // Create the Dicom Dictionary file
        const dicomDict = new dcmjs.data.DicomDict({});
        const dataset = buildDicosObject(instanceNumber, detection);
        dicomDict.dict =
          dcmjs.data.DicomMetaDictionary.denaturalizeDataset(dataset);
        // Create the buffer from the denaturalized data set populated above
        const new_file_WriterBuffer = dicomDict.write();
        // Create a blob with this buffer
        const file = new Blob([new_file_WriterBuffer], {
          type: 'image/dcs',
        });
        resolve(file);
      });
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Provides the unique instance identifier for a given DICOM Image.
 */
const getInstanceNumber = (
  image: Blob,
  currentFileFormat: DetectionType,
): Promise<number> => {
  const fileReader = new FileReader();
  if (currentFileFormat === DetectionType.TDR) {
    return new Promise((resolve, reject) => {
      fileReader.onerror = () => {
        fileReader.abort();
        reject('Unable to load file');
      };
      fileReader.onload = function (event) {
        const arrayBuffer = event.target!.result as ArrayBuffer;
        const dicomDict = dcmjs.data.DicomMessage.readFile(arrayBuffer);
        const dataset = dcmjs.data.DicomMetaDictionary.naturalizeDataset(
          dicomDict.dict,
        );
        resolve(dataset.InstanceNumber);
      };
      fileReader.readAsArrayBuffer(image);
    });
  } else if (currentFileFormat === DetectionType.COCO) {
    return new Promise((resolve) => {
      resolve(3.2825547455);
    });
  } else {
    throw new Error(
      'getInstanceNumber not implemented for provided detection type',
    );
  }
};
