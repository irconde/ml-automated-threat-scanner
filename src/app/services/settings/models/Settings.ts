import { FileFormat, WorkingMode } from '../../../../enums/platforms';
import { DetectionType } from '../../../../models/detection';

export interface ApplicationSettings {
  workingMode: WorkingMode;
  fileFormat: FileFormat;
  detectionFormat: DetectionType;
  fileNameSuffix: string;
  remoteIp: string;
  remotePort: string;
  selectedImagesDirPath?: string;
  // True when user logs in, gets removed on logout. Used to determine if session cookie is present for API validation.
  wasLoggedInBefore?: true;
  isFirstLaunch?: true;
}

export const DEFAULT_SETTINGS: ApplicationSettings = {
  detectionFormat: DetectionType.COCO,
  fileFormat: FileFormat.OpenRaster,
  fileNameSuffix: '_img',
  remoteIp: '',
  remotePort: '',
  selectedImagesDirPath: '',
  workingMode: WorkingMode.IndividualFile,
  // Exists by default, but gets removed after the first launch in the app-wrapper.component.ts
  isFirstLaunch: true,
};
