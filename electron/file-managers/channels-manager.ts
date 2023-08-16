import {BrowserWindow} from "electron";
import {ElectronSendFunc} from "../../shared/models/channels-payloads";

export class ChannelsManager {
  private browserWindow: BrowserWindow;
  constructor(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  protected sendAngularUpdate: ElectronSendFunc = (channel, payload) => {
    this.browserWindow.webContents.send(channel, payload);
  }

}
