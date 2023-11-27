import { cornerstone } from '../app/csSetup';
import { Detection } from './detection';

export interface ViewportData {
  imageData: cornerstone.Image | null;
  detectionData: Detection[];
}

export interface ViewportsMap {
  top: ViewportData;
  side: ViewportData;
}
