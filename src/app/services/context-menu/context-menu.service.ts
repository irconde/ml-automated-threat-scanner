import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class ContextMenuService {
  isLabelEditVisible: boolean = false;
  isColorEditVisible: boolean = false;

  constructor() {}
}
