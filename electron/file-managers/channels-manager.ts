import { BrowserWindow, ipcMain } from 'electron';
import {
  AngularChannelPayloadMapper,
  ElectronChannelPayloadMapper,
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

  protected onAngularEvent<Channel extends keyof AngularChannelPayloadMapper>(
    channel: Channel,
    listener: (
      e: Electron.IpcMainEvent,
      payload: AngularChannelPayloadMapper[Channel],
    ) => void,
  ) {
    ipcMain.on(channel, listener);
  }

  protected handleAngularEvent<
    Channel extends keyof AngularChannelPayloadMapper,
  >(
    channel: Channel,
    listener: (
      e: Electron.IpcMainEvent,
      payload: AngularChannelPayloadMapper[Channel],
    ) => Promise<ElectronChannelPayloadMapper[Channel]>,
  ) {
    ipcMain.handle(channel, listener);
  }
}
