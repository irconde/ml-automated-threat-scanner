import {Injectable} from '@angular/core';
import JSZip from 'jszip';
import {AnnotationType, ParsedORA, PixelData} from "../../models/file-parser";
import {v4 as guid} from 'uuid'

@Injectable({
  providedIn: 'root'
})
export class FileParserService {
  private zipUtil: JSZip;
  private domParser: DOMParser;
  constructor() {
    this.zipUtil = new JSZip();
    this.domParser = new DOMParser();
  }

  public async loadData(fileData: string) {
    try {
      const doc = await this.toXmlDoc(fileData);
      const parsedOra = await this.parseXmlDoc(doc);
      return await this.loadFilesData(parsedOra);
    } catch (e) {
      console.log(e);
      throw Error("Failed to load data")
    }
  }

  private async toXmlDoc(fileData: string) : Promise<Document> {
    await this.zipUtil.loadAsync(fileData, {base64: false})
    const stackFile = this.zipUtil.file('stack.xml');
    if(!stackFile) throw Error("Failed to find stack.xml");
    const stackString = await stackFile.async('string');
    return this.domParser.parseFromString(stackString, "text/xml");
  }

  private async parseXmlDoc(xmlDoc: Document) : Promise<ParsedORA> {
    const xmlImages = xmlDoc.getElementsByTagName('image');
    if(!xmlImages[0]) throw Error("Failed to find image element")
    const currentFileFormat = xmlImages[0].getAttribute('format');
    const parsedORA : ParsedORA = {
      format: currentFileFormat as AnnotationType || AnnotationType.UNKNOWN,
      viewpoints: [],
    };
    const stacks = Array.from(xmlImages[0].children)
    stacks.forEach((stack) => {

      const layers : Element[] = Array.from(stack.children);
      const firstLayer = layers.shift();
      if(!firstLayer) throw Error("No layers exist in stack")

      const pixelData = firstLayer.getAttribute('src');
      if(!pixelData) throw Error("Missing src attribute on first layer")

      if (parsedORA.format === AnnotationType.UNKNOWN) {
        parsedORA.format = this.getAnnotationType(pixelData);
      }

      const viewpoint = stack.getAttribute('view');
      if(!viewpoint) throw Error("Missing view attribute on stack");

      const imageId = stack.getAttribute('name')?.replace(/^\D+/g, '');
      if(!imageId) throw Error("Missing image id on stack");

      const detectionData: string[] = [];
      layers.forEach((layer)=> {
        const src = layer.getAttribute('src');
        src && detectionData.push(src);
      })

      parsedORA.viewpoints.push({ viewpoint, pixelData, imageId, detectionData });
    });

    return parsedORA;
  }

  private getAnnotationType(imageSrc: string) : AnnotationType {
    const fileExtension = imageSrc.split('.').pop();
    switch (fileExtension) {
      case 'dcs':
        return AnnotationType.TDR;
      case 'png':
      case 'jpg':
      case 'jpeg':
        return AnnotationType.COCO;
      default:
        throw Error("Failed to handle file type")
    }
  }

  private async loadFilesData(parsedOR: ParsedORA): Promise<{detectionData: any[], imageData: PixelData[]}> {
    const { format } = parsedOR
    const detectionData: any[] = [];
    const allPromises: Promise<string | Uint8Array | Blob | ArrayBuffer>[] = [];
    const imageData : PixelData[] = [];
    parsedOR.viewpoints.forEach((canvasViewpoint) => {
      // load detection data
      canvasViewpoint.detectionData.forEach((detectionPath) => {
        const detectionFile = this.zipUtil.file(detectionPath);
        if(!detectionFile) throw Error("Failed to load detection data")

        const fileType = format === AnnotationType.COCO ? 'string' : 'uint8array';
        const promise = detectionFile.async(fileType);
        allPromises.push(promise);

        promise.then((data) => {
           switch (format) {
             // TODO: read detection data here and push onto detection array
             case AnnotationType.COCO:
               break;
             case AnnotationType.TDR:
               break;
             default:
               throw Error("Annotation type not supported")
           }
        });
      });
      // load pixel data
      const pixelFile = this.zipUtil.file(canvasViewpoint.pixelData);
      if(!pixelFile) throw Error("Failed to load pixel data")
      const fileType = format === AnnotationType.COCO ? 'arraybuffer' : 'blob';
      const promise = pixelFile.async(fileType);
      allPromises.push(promise);

      promise.then((data) => {
        imageData.push({
          viewpoint: canvasViewpoint.viewpoint,
          pixelData: data,
          imageId: format === AnnotationType.COCO ? canvasViewpoint.imageId : guid(),
          type: format,
        });
      });
    });

    await Promise.all(allPromises);
    return { detectionData, imageData };
  }

}
