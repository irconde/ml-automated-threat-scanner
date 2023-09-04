import { Channels } from '../constants/channels';
import { ApplicationSettings } from '../../electron/models/Settings';
import { CurrentLocalDirectoryPayload } from './file-models';

export type ChannelPayloadMapper = {
  [Channels.NewFileRequest]: boolean;
  [Channels.SettingsUpdate]: ApplicationSettings;
  [Channels.CurrentFileUpdate]: CurrentLocalDirectoryPayload;
};

export type ElectronSendFunc = <Channel extends keyof ChannelPayloadMapper>(
  channel: Channel,
  payload: ChannelPayloadMapper[Channel],
) => void;
export type ElectronOnFunc = <Channel extends keyof ChannelPayloadMapper>(
  channel: Channel,
  listener: (payload: ChannelPayloadMapper[Channel]) => void,
) => void;

export interface ElectronAPI {
  /**
   * Send a message to the main process via a specified channel.
   */
  send: ElectronSendFunc;
  /**
   * Listen to a message from the main process via a specified channel.
   */
  on: ElectronOnFunc;
}
