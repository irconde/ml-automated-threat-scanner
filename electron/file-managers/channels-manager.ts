import {BrowserWindow, ipcMain} from "electron";
import {ChannelPayloadMapper, ElectronSendFunc} from "../../shared/models/channels-payloads";

export class ChannelsManager {
  private browserWindow: BrowserWindow;
  constructor(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  protected sendAngularUpdate: ElectronSendFunc = (channel, payload) => {
    this.browserWindow.webContents.send(channel, payload);
  }

  protected onAngularRequest<Channel extends keyof ChannelPayloadMapper>(channel: Channel, listener: (e: Electron.IpcMainEvent, payload: ChannelPayloadMapper[Channel]) => void)  {
    ipcMain.on(channel, listener)
  }

}
