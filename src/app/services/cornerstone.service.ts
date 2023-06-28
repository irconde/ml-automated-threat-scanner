import { Injectable } from '@angular/core';
import {Observable} from "rxjs";
import {fromPromise} from "rxjs/internal/observable/innerFrom";
import {cornerstone} from "../csSetup";

// declare const cornerstone;
@Injectable({
  providedIn: 'root'
})
export class CornerstoneService {

  constructor() { }

  fetchImage(imageId: string) : Observable<any> {
    return fromPromise(cornerstone.loadImage(imageId))
  }
}
