import { cornerstone } from '../app/csSetup';
import { DetectionClass } from './detection';

export interface ViewportData {
  imageData: cornerstone.Image | null;
  detectionData: DetectionClass[];
}

export interface ViewportsMap {
  top: ViewportData;
  side: ViewportData;
}
