// import * as fs from 'fs';
// import * as path from 'path';
// import { BrowserWindow } from 'electron';
// import { Channels } from '../../shared/constants/channels';
// import { CachedSettings } from './cached-settings';
// import { ChannelsManager } from './channels-manager';
// import { FilePayload, FileStatus } from '../../shared/models/file-models';
//
// class UserFilesManager extends ChannelsManager {
//   static STORAGE_FILE_NAME = 'thumbnails.json';
//   static IMAGE_FILE_EXTENSIONS = ['.ora', '.zip'];
//   fileNames: string[] = [];
//   currentFileIndex = 0;
//   #settings: CachedSettings;
//
//   constructor(cachedSettings: CachedSettings, browserWindow: BrowserWindow) {
//     super(browserWindow);
//     this.#settings = cachedSettings;
//     this.#init().then();
//   }
//
//   async #init() {
//     const anyFiles = await this.#updateFileNames();
//     this.#wireAngularChannels();
//     if (anyFiles) this.#sendCurrentFileUpdate().then();
//   }

// import * as fs from 'fs';
// import * as path from 'path';
// import { BrowserWindow } from 'electron';
// import { Channels } from '../../shared/constants/channels';
// import { CachedSettings } from './cached-settings';
// import { ChannelsManager } from './channels-manager';
// import { FilePayload, FileStatus } from '../../shared/models/file-models';
//
// class UserFilesManager extends ChannelsManager {
//   static STORAGE_FILE_NAME = 'thumbnails.json';
//   static IMAGE_FILE_EXTENSIONS = ['.ora', '.zip'];
//   fileNames: string[] = [];
//   currentFileIndex = 0;
//   #settings: CachedSettings;
//
//   constructor(cachedSettings: CachedSettings, browserWindow: BrowserWindow) {
//     super(browserWindow);
//     this.#settings = cachedSettings;
//     this.#init().then();
//   }
//
//   async #init() {
//     const anyFiles = await this.#updateFileNames();
//     this.#wireAngularChannels();
//     if (anyFiles) this.#sendCurrentFileUpdate().then();
//   }
//
//   #wireAngularChannels() {
//     this.onAngularRequest(Channels.NewFileRequest, (e, isNext) => {
//       if (isNext && this.currentFileIndex + 1 < this.fileNames.length) {
//         this.currentFileIndex++;
//         this.#sendCurrentFileUpdate().then();
//       } else if (!isNext && this.currentFileIndex > 0) {
//         this.currentFileIndex--;
//         this.#sendCurrentFileUpdate().then();
//       }
//     });
//   }
//
//   async #sendCurrentFileUpdate() {
//     const { selectedImagesDirPath } = this.#settings.get();
//     const file = await fs.promises.readFile(
//       path.join(selectedImagesDirPath!, this.fileNames[this.currentFileIndex]),
//       { encoding: 'base64' },
//     );
//     const payload: FilePayload = {
//       fileName: this.fileNames[this.currentFileIndex],
//       filesCount: this.fileNames.length,
//       file,
//       status: FileStatus.Ok,
//     };
//     this.sendAngularUpdate(Channels.CurrentFileUpdate, payload);
//   }
//
//   static #isFileTypeAllowed(fileName: string): boolean {
//     return UserFilesManager.IMAGE_FILE_EXTENSIONS.includes(
//       path.extname(fileName).toLowerCase(),
//     );
//   }
//
//   // updates the list of file names
//   async #updateFileNames(): Promise<boolean> {
//     const { selectedImagesDirPath } = this.#settings.get();
//     if (!selectedImagesDirPath) return false;
//     const foundFiles: string[] = await fs.promises.readdir(
//       selectedImagesDirPath,
//     );
//     this.fileNames = foundFiles.filter(UserFilesManager.#isFileTypeAllowed);
//     return !!this.fileNames.length;
//   }
// }
//
// export default UserFilesManager;

import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { Channels } from '../../shared/constants/channels';
import { ChannelsManager } from './channels-manager';
import { FilePayload, FileStatus } from '../../shared/models/file-models';
import { CachedSettings } from './cached-settings';

class UserFilesManager extends ChannelsManager {
  static STORAGE_FILE_NAME = 'thumbnails.json';
  static IMAGE_FILE_EXTENSIONS = ['.ora', '.zip'];
  fileNames: string[] = [];
  currentFileIndex = 0;
  cachedSettings: CachedSettings;

  constructor(browserWindow: BrowserWindow) {
    super(browserWindow);
    this.cachedSettings = new CachedSettings(
      browserWindow,
      async (settings) => {
        const path = settings?.selectedImagesDirPath;
        if (path) {
          const anyFiles = await this.#updateFileNames(path);
          if (anyFiles) this.#sendCurrentFileUpdate().then();
        }
      },
    );
    this.#wireAngularChannels();
  }

  #wireAngularChannels() {
    this.onAngularEvent(Channels.NewFileRequest, (e, isNext) => {
      if (isNext && this.currentFileIndex + 1 < this.fileNames.length) {
        this.currentFileIndex++;
        this.#sendCurrentFileUpdate().then();
      } else if (!isNext && this.currentFileIndex > 0) {
        this.currentFileIndex--;
        this.#sendCurrentFileUpdate().then();
      }
    });
  }

  async #sendCurrentFileUpdate() {
    const settings = this.cachedSettings.get();
    if (!settings) return;
    const file = await fs.promises.readFile(
      path.join(
        settings.selectedImagesDirPath!,
        this.fileNames[this.currentFileIndex],
      ),
      { encoding: 'base64' },
    );
    const payload: FilePayload = {
      fileName: this.fileNames[this.currentFileIndex],
      filesCount: this.fileNames.length,
      file,
      status: FileStatus.Ok,
    };
    this.sendAngularUpdate(Channels.CurrentFileUpdate, payload);
  }

  static #isFileTypeAllowed(fileName: string): boolean {
    return UserFilesManager.IMAGE_FILE_EXTENSIONS.includes(
      path.extname(fileName).toLowerCase(),
    );
  }

  async #updateFileNames(selectedImagesDirPath: string) {
    if (!selectedImagesDirPath) return false;
    const foundFiles: string[] = await fs.promises.readdir(
      selectedImagesDirPath,
    );
    this.fileNames = foundFiles.filter(UserFilesManager.#isFileTypeAllowed);
    return !!this.fileNames.length;
  }
}

export default UserFilesManager;
