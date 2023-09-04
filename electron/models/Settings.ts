import {FileFormat, WorkingMode} from '../../src/enums/platforms';
import {DetectionType} from '../../src/models/detection'; // export interface FileAndDetectionSettings {

// export interface FileAndDetectionSettings {
//   selectedImagesDirPath?: string;
//   selectedDetectionFile?: string;
// }

export interface ApplicationSettings {
  workingMode: WorkingMode;
  fileFormat: FileFormat;
  detectionFormat: DetectionType;
  fileNameSuffix: string;
  autoConnect: boolean;
  remoteIp: string;
  remotePort: string;
  selectedImagesDirPath?: string;
}

export const DEFAULT_SETTINGS: ApplicationSettings = {
  autoConnect: false,
  detectionFormat: DetectionType.COCO,
  fileFormat: FileFormat.OpenRaster,
  fileNameSuffix: 'img_',
  remoteIp: '127.0.0.1',
  remotePort: '4001',
  selectedImagesDirPath: '',
  workingMode: WorkingMode.RemoteServer,
};
