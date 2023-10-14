import {Injectable} from '@angular/core';
import {BehaviorSubject} from "rxjs";

@Injectable({
  providedIn: 'root'
})
export class UiService {

  private isSideMenuOpen = new BehaviorSubject(false);

  constructor() {
  }

  getIsSideMenuOpen() {
    return this.isSideMenuOpen.asObservable()
  }

  toggleSideMenu() {
    return this.isSideMenuOpen.next(!this.isSideMenuOpen.value)
  }
}
