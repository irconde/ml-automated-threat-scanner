import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { Channels } from '../../shared/constants/channels';
import { CurrentLocalDirectoryPayload } from '../../shared/models/file-models';
import { CachedSettings } from './cached-settings';
import { ChannelsManager } from './channels-manager';

class UserFilesManager extends ChannelsManager {
  static STORAGE_FILE_NAME = 'thumbnails.json';
  static IMAGE_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.dcm'];
  fileNames: string[] = [];
  currentFileIndex = 0;
  #settings: CachedSettings;

  constructor(cachedSettings: CachedSettings, browserWindow: BrowserWindow) {
    super(browserWindow);
    this.#settings = cachedSettings;
    this.#init().then();
  }

  async #init() {
    const anyFiles = await this.#updateFileNames();
    this.#wireAngularChannels();
    if (anyFiles) this.#sendCurrentFileUpdate().then();
  }

  #wireAngularChannels() {
    this.onAngularRequest(Channels.NewFileRequest, (e, isNext) => {
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
    const { selectedImagesDirPath } = this.#settings.get();
    const pixelData = await fs.promises.readFile(
      path.join(selectedImagesDirPath!, this.fileNames[this.currentFileIndex])
    );
    const payload: CurrentLocalDirectoryPayload = {
      fileName: this.fileNames[this.currentFileIndex],
      filesCount: this.fileNames.length,
      pixelData,
    };
    this.sendAngularUpdate(Channels.CurrentFileUpdate, payload);
  }

  static #isFileTypeAllowed(fileName: string): boolean {
    return UserFilesManager.IMAGE_FILE_EXTENSIONS.includes(
      path.extname(fileName).toLowerCase()
    );
  }

  // updates the list of file names
  async #updateFileNames(): Promise<boolean> {
    const { selectedImagesDirPath } = this.#settings.get();
    if (!selectedImagesDirPath) return false;
    const foundFiles: string[] = await fs.promises.readdir(
      selectedImagesDirPath
    );
    this.fileNames = foundFiles.filter(UserFilesManager.#isFileTypeAllowed);
    return !!this.fileNames.length;
  }
}

export default UserFilesManager;
