import {Settings} from "../models/settings";
import * as fs from "fs";
import * as path from "path";
import {BrowserWindow} from "electron";
import {Channels} from "../../shared/constants/channels";
import {FilesUpdatePayload} from "../../shared/modals/channels-payloads";

class UserFilesManager {
  static STORAGE_FILE_NAME = 'thumbnails.json';
  static IMAGE_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.dcm'];
  fileNames: string[] = [];
  currentFileIndex = -1;
  #settings: Settings;
  #browserWindow: BrowserWindow;

  constructor(settings: Settings, browserWindow: BrowserWindow) {
    this.#settings = settings;
    this.#browserWindow = browserWindow;
    this.#init().then();
  }

  async #init() {
    const anyFiles = await this.#updateFileNames();
    if(anyFiles) {
      this.#browserWindow.webContents.send(
        Channels.FilesUpdate,
        {fileName: this.fileNames[this.currentFileIndex]} as FilesUpdatePayload)
    }
    console.log(this.fileNames)
  }

  static #isFileTypeAllowed(fileName: string) : boolean {
    return UserFilesManager.IMAGE_FILE_EXTENSIONS.includes(
      path.extname(fileName).toLowerCase()
    );
  }

  // updates the list of file names
  async #updateFileNames() : Promise<boolean> {
    if(!this.#settings.selectedImagesDirPath) return false;
    const foundFiles: string[] = await fs.promises.readdir(this.#settings.selectedImagesDirPath);
    this.fileNames = foundFiles.filter(UserFilesManager.#isFileTypeAllowed);
    return !!this.fileNames.length;
  }

}

export default UserFilesManager;
