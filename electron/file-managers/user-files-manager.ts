import * as fs from 'fs';
import * as path from 'path';
import { BrowserWindow } from 'electron';
import { Channels } from '../../shared/constants/channels';
import { ChannelsManager } from './channels-manager';
import { FilePayload, FileStatus } from '../../shared/models/file-models';

class UserFilesManager extends ChannelsManager {
  static STORAGE_FILE_NAME = 'thumbnails.json';
  static IMAGE_FILE_EXTENSIONS = ['.ora', '.zip'];
  fileNames: string[] = [];
  currentFileIndex = 0;

  constructor(browserWindow: BrowserWindow) {
    super(browserWindow);
    this.#wireAngularChannels();
  }

  static #isFileTypeAllowed(fileName: string): boolean {
    return UserFilesManager.IMAGE_FILE_EXTENSIONS.includes(
      path.extname(fileName).toLowerCase(),
    );
  }

  #wireAngularChannels() {
    this.handleAngularEvent(
      Channels.NewFileInvoke,
      async (
        e,
        { isNext, selectedImagesDirPath },
      ): Promise<FilePayload | null> => {
        if (isNext && this.currentFileIndex + 1 < this.fileNames.length) {
          this.currentFileIndex++;
          return this.#getCurrentFilePayload(selectedImagesDirPath);
        } else if (!isNext && this.currentFileIndex > 0) {
          this.currentFileIndex--;
          return this.#getCurrentFilePayload(selectedImagesDirPath);
        } else {
          return null;
        }
      },
    );
    this.handleAngularEvent(
      Channels.InitFilesInvoke,
      async (e, { selectedImagesDirPath }) => {
        const anyFiles = await this.#updateFileNames(selectedImagesDirPath);
        return anyFiles
          ? this.#getCurrentFilePayload(selectedImagesDirPath)
          : null;
      },
    );
  }

  async #getCurrentFilePayload(
    selectedImagesDirPath: string,
  ): Promise<FilePayload | null> {
    if (!selectedImagesDirPath) return null;
    const file = await fs.promises.readFile(
      path.join(selectedImagesDirPath, this.fileNames[this.currentFileIndex]),
      { encoding: 'base64' },
    );
    return {
      fileName: this.fileNames[this.currentFileIndex],
      filesCount: this.fileNames.length,
      file,
      status: FileStatus.Ok,
    };
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
