import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import {
  FileParserOutput,
  ParsedORA,
  PixelData,
} from '../../../models/file-parser';
import { v4 as guid } from 'uuid';
import {
  cocoBoxToBoundingBox,
  getMasks,
} from '../../utilities/detection.utilities';
import {
  DetectionAlgorithm,
  DetectionType,
  RawCocoDetection,
  RawDetection,
  RawDicosDetection,
} from '../../../models/detection';
import dicomParser from 'dicom-parser';
import * as DICOS from '../../utilities/dicos/dicos.utilities';

@Injectable({
  providedIn: 'root',
})
export class FileParserService {
  private zipUtil: JSZip;
  private domParser: DOMParser;

  constructor() {
    this.zipUtil = new JSZip();
    this.domParser = new DOMParser();
  }

  /**
   * Loads data from a provided ArrayBuffer containing XML data.
   *
   * @param fileData - The ArrayBuffer containing XML data to be loaded.
   * @returns A Promise that resolves to the loaded data.
   * @throws {Error} If loading data fails for any reason.
   */
  public async loadData(fileData: string): Promise<FileParserOutput> {
    try {
      const doc = await this.toXmlDoc(fileData);
      const parsedOra = await this.parseXmlDoc(doc);
      return await this.loadFilesData(parsedOra);
    } catch (e) {
      console.log(e);
      throw Error('Failed to load data');
    }
  }

  /**
   * Converts ArrayBuffer containing XML data into an XML Document.
   *
   * @param fileData - The ArrayBuffer containing XML data to be converted.
   * @throws {Error} If there's an issue finding or parsing the 'stack.xml' file.
   * @returns A Promise that resolves to an XML Document representing the parsed XML data.
   */
  private async toXmlDoc(fileData: string): Promise<Document> {
    await this.zipUtil.loadAsync(fileData, { base64: true });
    const stackFile = this.zipUtil.file('stack.xml');
    if (!stackFile) throw Error('Failed to find stack.xml');
    const stackString = await stackFile.async('string');
    return this.domParser.parseFromString(stackString, 'text/xml');
  }

  /**
   * Parses an XML Document and extracts relevant information into a ParsedORA object.
   *
   * @param xmlDoc - The XML Document to be parsed.
   * @throws {Error} If there are issues finding required elements or attributes in the XML Document.
   * @returns A Promise that resolves to a ParsedORA object containing extracted information.
   */
  private async parseXmlDoc(xmlDoc: Document): Promise<ParsedORA> {
    const xmlImages = xmlDoc.getElementsByTagName('image');
    if (!xmlImages[0]) throw Error('Failed to find image element');
    const currentFileFormat = xmlImages[0].getAttribute('format');
    const parsedORA: ParsedORA = {
      format: (currentFileFormat as DetectionType) || DetectionType.UNKNOWN,
      viewpoints: [],
    };
    const stacks = Array.from(xmlImages[0].children);
    stacks.forEach((stack) => {
      const layers: Element[] = Array.from(stack.children);
      const firstLayer = layers.shift();
      if (!firstLayer) throw Error('No layers exist in stack');

      const pixelData = firstLayer.getAttribute('src');
      if (!pixelData) throw Error('Missing src attribute on first layer');

      if (parsedORA.format === DetectionType.UNKNOWN) {
        parsedORA.format = this.getDetectionType(pixelData);
      }

      const viewpoint = stack.getAttribute('view');
      if (!viewpoint) throw Error('Missing view attribute on stack');

      const imageId = stack.getAttribute('name')?.replace(/^\D+/g, '');
      if (!imageId) throw Error('Missing image id on stack');

      const detectionData: string[] = [];
      layers.forEach((layer) => {
        const src = layer.getAttribute('src');
        src && detectionData.push(src);
      });

      parsedORA.viewpoints.push({
        viewpoint,
        pixelData,
        imageId,
        detectionData,
      });
    });

    return parsedORA;
  }

  /**
   * Determines the detection type based on the file extension of an image source.
   *
   * @param imageSrc - The source of the image file.
   * @throws {Error} If the file type cannot be handled.
   * @returns The determined detection type.
   */
  private getDetectionType(imageSrc: string): DetectionType {
    const fileExtension = imageSrc.split('.').pop();
    switch (fileExtension) {
      case 'dcs':
        return DetectionType.TDR;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return DetectionType.COCO;
      default:
        throw Error('Failed to handle file type');
    }
  }

  /**
   * Loads detection and image pixel data from parsedORA object.
   *
   * @param parsedOR - The parsedORA object containing information about detection and pixel data.
   * @throws {Error} If there are issues loading detection or pixel data.
   * @returns A Promise that resolves to an object containing loaded detection data, image pixel data, and optionally algorithms data
   */
  private async loadFilesData(parsedOR: ParsedORA): Promise<FileParserOutput> {
    const { format } = parsedOR;
    const detectionData: RawDetection[] = [];
    const allPromises: Promise<unknown>[] = [];
    const imageData: PixelData[] = [];
    const algorithms: Record<string, DetectionAlgorithm> = {};
    parsedOR.viewpoints.forEach((canvasViewpoint) => {
      // load detection data
      canvasViewpoint.detectionData.forEach((detectionPath) => {
        const detectionPromise = this.readDetectionData(
          detectionPath,
          format,
          canvasViewpoint.viewpoint,
        );
        allPromises.push(detectionPromise);
        detectionPromise.then(([detection, algorithm]) => {
          detectionData.push(detection);
          // add the algorithm (no duplicates)
          if (algorithm?.name && !algorithms[algorithm.name]) {
            algorithms[algorithm.name] = algorithm;
          }
        });
      });
      // load pixel data
      const pixelDataPromise = this.readPixelData(
        canvasViewpoint.pixelData,
        format,
      );
      allPromises.push(pixelDataPromise);

      pixelDataPromise.then((data) => {
        imageData.push({
          viewpoint: canvasViewpoint.viewpoint,
          pixelData: data,
          imageId:
            format === DetectionType.COCO ? canvasViewpoint.imageId : guid(),
          type: format,
        });
      });
    });

    await Promise.all(allPromises);
    const returnValue: FileParserOutput = { detectionData, imageData };
    // return the algorithms too if there are any
    if (Object.keys(algorithms).length) {
      returnValue.algorithms = algorithms;
    }

    return returnValue;
  }

  /**
   * Reads pixel data from a specified path in the ZIP archive.
   *
   * @param {string} pixelDataPath - The path to the pixel data in the ZIP archive.
   * @param {DetectionType} format - The detection type format.
   * @throws {Error} If there's an issue loading the pixel data.
   * @returns {Promise<ArrayBuffer | Blob>} A Promise that resolves to the loaded pixel data as an ArrayBuffer or Blob.
   */
  private async readPixelData(
    pixelDataPath: string,
    format: DetectionType,
  ): Promise<ArrayBuffer | Blob> {
    const pixelFile = this.zipUtil.file(pixelDataPath);
    if (!pixelFile) throw Error('Failed to load pixel data');
    const fileType = format === DetectionType.COCO ? 'arraybuffer' : 'blob';
    return pixelFile.async(fileType);
  }

  /**
   * Reads and loads detection data from a specified source based on the detection type.
   *
   * @param {string} detectionDataSrc - The source of the detection data.
   * @param {DetectionType} format - The detection type format.
   * @param {string} viewpoint - The viewpoint associated with the detection data.
   * @throws {Error} If there's an issue loading or parsing the detection data or if the detection type is not supported.
   * @returns {Promise<readonly [RawDetection, DetectionAlgorithm?]>} A Promise that resolves to the loaded detection data and an optional algorithm
   */
  private async readDetectionData(
    detectionDataSrc: string,
    format: DetectionType,
    viewpoint: string,
  ): Promise<readonly [RawDetection, DetectionAlgorithm?]> {
    const detectionFile = this.zipUtil.file(detectionDataSrc);
    if (!detectionFile) throw Error('Failed to load detection data');

    switch (format) {
      case DetectionType.COCO:
        return [await this.loadCocoDetections(detectionFile, viewpoint)];
      case DetectionType.TDR:
        return await this.loadDicosDetections(detectionFile, viewpoint);
      default:
        throw Error('Detection type not supported');
    }
  }

  /**
   * Loads COCO format detection data from a given file.
   *
   * @param {JSZip.JSZipObject} detectionFile - The COCO format detection data file.
   * @param {string} viewpoint - The viewpoint associated with the detection data.
   * @throws {Error} If there's an issue loading or parsing the COCO format detection data.
   * @returns {Promise<RawCocoDetection>} A Promise that resolves to the loaded COCO format detection data.
   */
  private async loadCocoDetections(
    detectionFile: JSZip.JSZipObject,
    viewpoint: string,
  ): Promise<RawCocoDetection> {
    const cocoData = await detectionFile.async('string');
    const parsedCocoData = JSON.parse(cocoData);
    const { annotations, info } = parsedCocoData;
    const { className, confidence, bbox, image_id, segmentation } =
      annotations[0];
    const boundingBox = cocoBoxToBoundingBox(bbox);
    boundingBox[2] = Math.abs(boundingBox[2] - boundingBox[0]);
    boundingBox[3] = Math.abs(boundingBox[3] - boundingBox[1]);
    const { binaryMask, polygonMask } = getMasks(boundingBox, segmentation);
    return {
      algorithm: info.algorithm,
      className,
      confidence,
      viewpoint,
      boundingBox,
      binaryMask,
      polygonMask,
      uuid: guid(),
      detectionFromFile: true,
      imageId: image_id,
    };
  }

  /**
   * Loads DICOS format detection data from a given file.
   *
   * @param {JSZip.JSZipObject} detectionFile - The DICOS format detection data file.
   * @param {string} viewpoint - The viewpoint associated with the detection data.
   * @throws {Error} If there's an issue loading or parsing the DICOS format detection data.
   * @returns {Promise<RawDicosDetection>} A Promise that resolves to the loaded DICOS format detection data.
   */
  private async loadDicosDetections(
    detectionFile: JSZip.JSZipObject,
    viewpoint: string,
  ): Promise<readonly [RawDicosDetection, DetectionAlgorithm]> {
    const dicosData: Uint8Array = await detectionFile.async('uint8array');
    const dataSet: dicomParser.DataSet = dicomParser.parseDicom(dicosData);
    const algorithm = this.getDicosDetectionAlgorithm(dataSet);
    const threatSequence = dataSet.elements['x40101011'];
    const alarmObjectNumTag =
      DICOS.DICOS_DICTIONARY['NumberOfAlarmObjects'].tag;
    const alarmObjectNum = dataSet.uint16(alarmObjectNumTag);
    if (
      threatSequence == null ||
      alarmObjectNum === 0 ||
      alarmObjectNum === undefined
    ) {
      throw Error('Missing tag on Number of Alarm Objects');
    } else if (!threatSequence.items) {
      throw Error('No items found in Dicom sequence');
    } else {
      const dicomElement: dicomParser.Element = threatSequence.items[0];
      const boundingBox = DICOS.retrieveBoundingBoxData(dicomElement);
      boundingBox[2] = Math.abs(boundingBox[2] - boundingBox[0]);
      boundingBox[3] = Math.abs(boundingBox[3] - boundingBox[1]);
      const className = DICOS.retrieveObjectClass(dicomElement);
      const confidence = DICOS.decimalToPercentage(
        DICOS.retrieveConfidenceLevel(dicomElement),
      );
      const binaryMask = DICOS.retrieveMaskData(dicomElement, dataSet);
      return [
        {
          algorithm: algorithm.name || '',
          className: className || '',
          confidence,
          viewpoint,
          boundingBox,
          binaryMask,
          detectionFromFile: true,
          uuid: guid(),
        },
        algorithm,
      ];
    }
  }

  /**
   * Given a DICOM dataset, it returns information about the algorithm used to generate the detection
   * @param dataSet
   */
  private getDicosDetectionAlgorithm(
    dataSet: dicomParser.DataSet,
  ): DetectionAlgorithm {
    const name = dataSet.string(
      DICOS.DICOS_DICTIONARY.ThreatDetectionAlgorithmandVersion.tag,
    );
    // construct algorithm information object
    const detectorType = dataSet.string(
      DICOS.DICOS_DICTIONARY.DetectorType.tag,
    );
    const detectorConfiguration = dataSet.string(
      DICOS.DICOS_DICTIONARY.DetectorConfiguration.tag,
    );
    const series = dataSet.string(DICOS.DICOS_DICTIONARY.SeriesDescription.tag);
    const study = dataSet.string(DICOS.DICOS_DICTIONARY.StudyDescription.tag);

    return { name, detectorType, detectorConfiguration, series, study };
  }
}
