import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { ImageStatus } from './model/enum';

@Injectable({
  providedIn: 'root',
})
export class UiService {
  private isSideMenuOpen = new BehaviorSubject(true);
  private imageStatusSub = new BehaviorSubject(ImageStatus.NoImage);

  constructor() {}

  getIsSideMenuOpen() {
    return this.isSideMenuOpen.asObservable();
  }

  toggleSideMenu() {
    return this.isSideMenuOpen.next(!this.isSideMenuOpen.value);
  }

  getImageStatus() {
    return this.imageStatusSub.asObservable();
  }

  setImageStatus(status: ImageStatus) {
    return this.imageStatusSub.next(status);
  }
}
