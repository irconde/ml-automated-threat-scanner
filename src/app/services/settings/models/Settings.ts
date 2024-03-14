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
  workingMode: WorkingMode.MinIO,
  isFirstLaunch: true,
};
