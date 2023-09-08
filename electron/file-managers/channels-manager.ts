import { BrowserWindow, ipcMain } from 'electron';
import {
  ChannelPayloadMapper, ElectronChannelPayloadMapper,
  ElectronSendFunc,
} from '../../shared/models/channels-payloads';

export class ChannelsManager {
  private browserWindow: BrowserWindow;

  constructor(browserWindow: BrowserWindow) {
    this.browserWindow = browserWindow;
  }

  protected sendAngularUpdate: ElectronSendFunc = (channel, payload) => {
    this.browserWindow.webContents.send(channel, payload);
  };

  protected onAngularEvent<Channel extends keyof ChannelPayloadMapper>(
    channel: Channel,
    listener: (
      e: Electron.IpcMainEvent,
      payload: ChannelPayloadMapper[Channel],
    ) => void,
  ) {
    ipcMain.on(channel, listener);
  }

  protected handleAngularEvent<Channel extends keyof ChannelPayloadMapper>(
    channel: Channel,
    listener: (
      e: Electron.IpcMainEvent,
      payload: ChannelPayloadMapper[Channel]
    ) => Promise<ElectronChannelPayloadMapper[Channel]>
  ) {

    ipcMain.handle(channel, listener)
  }

}
