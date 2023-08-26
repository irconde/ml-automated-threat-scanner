import {Injectable} from '@angular/core';
import {Observable} from 'rxjs';
import {fromPromise} from 'rxjs/internal/observable/innerFrom';
import {cornerstone, cornerstoneWADOImageLoader} from '../csSetup';
// @ts-ignore
import {arrayBufferToImage, createImage} from 'cornerstone-web-image-loader';
import {PixelData} from '../../models/file-parser';
import {DetectionType} from '../../models/detection';

// declare const cornerstone;
@Injectable({
  providedIn: 'root',
})
export class CornerstoneService {
  constructor() {}

  async #arrayBufferToImage(
    imageId: string,
    arrayBuffer: ArrayBuffer
  ): Promise<cornerstone.Image> {
    const image = await arrayBufferToImage(arrayBuffer);
    const imageObject: cornerstone.Image = createImage(image, imageId);
    imageObject.rgba = true;
    return imageObject;
  }

  getImageData(pixelData: PixelData): Observable<cornerstone.Image> {
    if (pixelData.type === DetectionType.COCO) {
      const imagePromise = this.#arrayBufferToImage(
        pixelData.imageId,
        pixelData.pixelData as ArrayBuffer
      );
      return fromPromise(imagePromise);
    } else if (pixelData.type === DetectionType.TDR) {
      const dicomString = cornerstoneWADOImageLoader.wadouri.fileManager.add(
        pixelData.pixelData
      );
      const imagePromise = cornerstone.loadImage(dicomString);
      return fromPromise(imagePromise);
    } else {
      throw Error('Failed to get image data. Type unknown.');
    }
  }
}
