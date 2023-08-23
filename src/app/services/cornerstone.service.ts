import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {cornerstone} from "../csSetup";
// @ts-ignore
import { arrayBufferToImage, createImage } from 'cornerstone-web-image-loader';

// declare const cornerstone;
@Injectable({
  providedIn: 'root'
})
export class CornerstoneService {

  constructor() {}

  async #arrayBufferToImage(imageId: string, arrayBuffer: ArrayBuffer) : Promise<cornerstone.Image> {
    const image = await arrayBufferToImage(arrayBuffer)
    const imageObject: cornerstone.Image = createImage(image, imageId);
    imageObject.rgba = true;
    return imageObject
  }

  getImageData(imageId: string, pixelData: ArrayBuffer) : Observable<cornerstone.Image> {
    const image = this.#arrayBufferToImage(imageId, pixelData)
    return fromPromise(image)
  }
}
