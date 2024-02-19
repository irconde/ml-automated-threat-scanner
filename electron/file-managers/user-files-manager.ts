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
        const { anyFiles } = await this.#updateFileNames(selectedImagesDirPath);
        return anyFiles
          ? this.#getCurrentFilePayload(selectedImagesDirPath)
          : null;
      },
    );
    this.handleAngularEvent(
      Channels.SaveCurrentFileInvoke,
      async (e, { base64File, selectedImagesDirPath }) => {
        const filePath = path.join(
          selectedImagesDirPath,
          this.fileNames[this.currentFileIndex],
        );
        await fs.promises.writeFile(filePath, base64File, {
          encoding: 'base64',
        });
        this.currentFileIndex++;
        if (this.currentFileIndex >= this.fileNames.length) {
          this.currentFileIndex = 0;
          return null;
        } else {
          return this.#getCurrentFilePayload(selectedImagesDirPath);
        }
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

  async #updateFileNames(
    selectedImagesDirPath: string,
  ): Promise<{ anyFiles: boolean }> {
    if (!selectedImagesDirPath) return { anyFiles: false };
    const foundFiles: string[] = await fs.promises.readdir(
      selectedImagesDirPath,
    );
    this.fileNames = foundFiles.filter(UserFilesManager.#isFileTypeAllowed);
    return { anyFiles: !!this.fileNames.length };
  }
}

export default UserFilesManager;
