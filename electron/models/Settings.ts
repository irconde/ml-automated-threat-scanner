import { FileFormat, WorkingMode } from '../../src/enums/platforms';
import { DetectionType } from '../../src/models/detection';
import { Preferences } from '@capacitor/preferences';

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

export const loadSettings = async () => {
  return {
    workingMode: JSON.parse(
      JSON.stringify(await Preferences.get({ key: 'workingMode' })),
    ),
    fileFormat: JSON.parse(
      JSON.stringify(await Preferences.get({ key: 'fileFormat' })),
    ),
    detectionFormat: JSON.parse(
      JSON.stringify(await Preferences.get({ key: 'detectionFormat' })),
    ),
    fileNameSuffix: JSON.parse(
      JSON.stringify(await Preferences.get({ key: 'fileNameSuffix' })),
    ),
    autoConnect: JSON.parse(
      JSON.stringify(await Preferences.get({ key: 'autoConnect' })),
    ),
    remoteIp: JSON.parse(
      JSON.stringify(await Preferences.get({ key: 'remoteIp' })),
    ),
    remotePort: JSON.parse(
      JSON.stringify(await Preferences.get({ key: 'remotePort' })),
    ),
    selectedImagesDirPath: JSON.parse(
      JSON.stringify(await Preferences.get({ key: 'selectedImagesDirPath' })),
    ),
  };
};

export const setSettings = async (settings: ApplicationSettings) => {
  await Preferences.set({
    key: 'workingMode',
    value: JSON.stringify(settings.workingMode),
  });
  await Preferences.set({
    key: 'fileFormat',
    value: JSON.stringify(settings.fileFormat),
  });
  await Preferences.set({
    key: 'detectionFormat',
    value: JSON.stringify(settings.detectionFormat),
  });
  await Preferences.set({
    key: 'fileNameSuffix',
    value: settings.fileNameSuffix,
  });
  await Preferences.set({
    key: 'autoConnect',
    value: JSON.stringify(settings.autoConnect),
  });
  await Preferences.set({
    key: 'remoteIp',
    value: settings.remoteIp,
  });
  await Preferences.set({
    key: 'remotePort',
    value: settings.remotePort,
  });
  settings.selectedImagesDirPath &&
    (await Preferences.set({
      key: 'selectedImagesDirPath',
      value: settings.selectedImagesDirPath,
    }));
};
