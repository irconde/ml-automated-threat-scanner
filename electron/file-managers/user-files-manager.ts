import {Settings} from "../models/settings";
import * as fs from "fs";
import * as path from "path";
import {BrowserWindow} from "electron";
import {Channels} from "../../shared/constants/channels";
import {ChannelPayload, CurrentFileUpdatePayload} from "../../shared/modals/channels-payloads";
import {CachedSettings} from "./settings-manager";

class UserFilesManager {
  static STORAGE_FILE_NAME = 'thumbnails.json';
  static IMAGE_FILE_EXTENSIONS = ['.png', '.jpg', '.jpeg', '.dcm'];
  fileNames: string[] = [];
  currentFileIndex = 0;
  #settings: CachedSettings;
  #browserWindow: BrowserWindow;

  constructor(cachedSettings: CachedSettings, browserWindow: BrowserWindow) {
    this.#settings = cachedSettings;
    this.#browserWindow = browserWindow;
    this.#init().then();
  }

  async #init() {
    const anyFiles = await this.#updateFileNames();
    if(anyFiles) {
      this.#sendAngularUpdate(
        Channels.CurrentFileUpdate,
        {fileName: this.fileNames[this.currentFileIndex]} as CurrentFileUpdatePayload)
    }
    console.log(this.fileNames)
  }

  #sendAngularUpdate(channel: Channels,payload: ChannelPayload) {
    this.#browserWindow.webContents.send(channel, payload)
  }

  static #isFileTypeAllowed(fileName: string) : boolean {
    return UserFilesManager.IMAGE_FILE_EXTENSIONS.includes(
      path.extname(fileName).toLowerCase()
    );
  }

  // updates the list of file names
  async #updateFileNames() : Promise<boolean> {
    const { selectedImagesDirPath} = await this.#settings.get();
    if(!selectedImagesDirPath) return false;
    const foundFiles: string[] = await fs.promises.readdir(selectedImagesDirPath);
    this.fileNames = foundFiles.filter(UserFilesManager.#isFileTypeAllowed);
    return !!this.fileNames.length;
  }

}

export default UserFilesManager;
