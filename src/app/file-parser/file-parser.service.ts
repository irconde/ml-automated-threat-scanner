import { Injectable } from '@angular/core';
import JSZip from 'jszip';
import {AnnotationType, ParsedORA} from "../../models/file-parser";

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

  async loadData(fileData: string) {
    const doc = await this.toXmlDoc(fileData);
    const parsedOra = await this.parseXmlDoc(doc);



  }

  private async toXmlDoc(fileData: string) : Promise<Document> {
    await this.zipUtil.loadAsync(fileData, {base64: true})
    const stackFile = await this.zipUtil.file('stack.xml');
    if(!stackFile) throw Error("Failed to find stack.xml");
    const stackString = await stackFile.async('string');
    return this.domParser.parseFromString(stackString, "text/xml");
  }

  private async parseXmlDoc(xmlDoc: Document) : Promise<ParsedORA> {
    const xmlImages = xmlDoc.getElementsByTagName('image');
    if(!xmlImages[0]) throw Error("Failed to find image element")
    const currentFileFormat = xmlImages[0].getAttribute('format');
    const parsedORA : ParsedORA = {
      format: currentFileFormat || "",
      viewpoints: [],
    };
    const stacks = Array.from(xmlImages[0].children)
    stacks.forEach((stack) => {

      const layers : Element[] = Array.from(stack.children);
      const firstLayer = layers.shift();
      if(!firstLayer) throw Error("No layers exist in stack")

      const pixelData = firstLayer.getAttribute('src');
      if(!pixelData) throw Error("Missing src attribute on first layer")

      if (parsedORA.format === "") {
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

  // async loadData() {
  //   return new Promise((resolve, reject) => {
  //     const zipUtil = new JSZip();
  //     zipUtil
  //       .loadAsync(this.#fileData, { base64: true })
  //       .then(() => {
  //         zipUtil
  //           .file('stack.xml')
  //           .async('string')
  //           .then((stackFile) => {
  //             this.#xmlParser = new XmlParserUtil(stackFile);
  //             const parsedData =
  //               this.#xmlParser.getParsedXmlData();
  //             this.#loadFilesData(parsedData, zipUtil)
  //               .then((filesData) => resolve(filesData))
  //               .catch((error) => reject(error));
  //           })
  //           .catch((error) => reject(error));
  //       })
  //       .catch((error) => reject(error));
  //   });
  // }
}
