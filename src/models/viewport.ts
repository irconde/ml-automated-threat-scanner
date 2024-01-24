import { cornerstone } from '../app/csSetup';
import { Detection } from './detection';

export interface ViewportData {
  imageData: cornerstone.Image | null;
  detectionData: Detection[];
}

export const ViewportNames = ['top', 'side'] as const;

export type ViewportsMap = {
  [key in (typeof ViewportNames)[number]]: ViewportData;
};
