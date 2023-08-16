import * as fs from "fs";
import * as path from "path";
import {BrowserWindow, ipcMain} from "electron";
import {Channels} from "../../shared/constants/channels";
import {ChannelPayload, CurrentFileUpdatePayload} from "../../shared/models/channels-payloads";
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
    this.#wireAngularChannels();
    if(anyFiles) this.#sendCurrentFileUpdate().then()
  }

  #wireAngularChannels() {
    ipcMain.on(Channels.RequestNewFile, (e, isNext)=> {
      if(isNext && this.currentFileIndex + 1 < this.fileNames.length) {
        this.currentFileIndex++;
        this.#sendCurrentFileUpdate().then()
      } else if(!isNext && this.currentFileIndex > 0) {
        this.currentFileIndex--;
        this.#sendCurrentFileUpdate().then()
      }
    })
  }

  #sendAngularUpdate(channel: Channels, payload: ChannelPayload) {
    this.#browserWindow.webContents.send(channel, payload)
  }

  async #sendCurrentFileUpdate() {
    const { selectedImagesDirPath} = this.#settings.get();
    const pixelData = await fs.promises.readFile(
      path.join(
        selectedImagesDirPath!,
        this.fileNames[this.currentFileIndex]
      )
    )
    const payload: CurrentFileUpdatePayload = {
      fileName: this.fileNames[this.currentFileIndex],
      filesCount: this.fileNames.length,
      pixelData,
    }
    this.#sendAngularUpdate(Channels.CurrentFileUpdate, payload);
  }

  static #isFileTypeAllowed(fileName: string) : boolean {
    return UserFilesManager.IMAGE_FILE_EXTENSIONS.includes(
      path.extname(fileName).toLowerCase()
    );
  }

  // updates the list of file names
  async #updateFileNames() : Promise<boolean> {
    const { selectedImagesDirPath} = this.#settings.get();
    if(!selectedImagesDirPath) return false;
    const foundFiles: string[] = await fs.promises.readdir(selectedImagesDirPath);
    this.fileNames = foundFiles.filter(UserFilesManager.#isFileTypeAllowed);
    return !!this.fileNames.length;
  }

}

export default UserFilesManager;
