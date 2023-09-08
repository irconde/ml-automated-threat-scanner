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

    // const path = settings?.selectedImagesDirPath;
    // if (path) {
    //   const anyFiles = await this.#updateFileNames(path);
    //   if (anyFiles) this.#sendCurrentFileUpdate().then();
    // }
    //

    this.#wireAngularChannels();
  }

  #wireAngularChannels() {
    this.onAngularEvent(Channels.NewFileRequest, (e, isNext) => {
      if (isNext && this.currentFileIndex + 1 < this.fileNames.length) {
        this.currentFileIndex++;
        // this.#sendCurrentFileUpdate().then();
      } else if (!isNext && this.currentFileIndex > 0) {
        this.currentFileIndex--;
        // this.#sendCurrentFileUpdate().then();
      }
    });
    this.handleAngularEvent(
      Channels.InitFilesRequest,
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
  ): Promise<FilePayload> {
    const file = await fs.promises.readFile(
      path.join(selectedImagesDirPath!, this.fileNames[this.currentFileIndex]),
      { encoding: 'base64' },
    );
    return {
      fileName: this.fileNames[this.currentFileIndex],
      filesCount: this.fileNames.length,
      file,
      status: FileStatus.Ok,
    };
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
