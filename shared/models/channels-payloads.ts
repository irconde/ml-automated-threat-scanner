import { Channels } from '../constants/channels';
import { ApplicationSettings } from '../../electron/models/Settings';
import { CurrentLocalDirectoryPayload } from './file-models';

export type ChannelPayloadMapper = {
  // angular payload
  [Channels.NewFileRequest]: boolean;
  // angular or electron payload
  [Channels.SettingsUpdate]: ApplicationSettings;
  // electron payload
  [Channels.CurrentFileUpdate]: CurrentLocalDirectoryPayload;
  // electron payload
  [Channels.FolderPickerInvoke]: { path: string };
};

export type ElectronSendFunc = <Channel extends keyof ChannelPayloadMapper>(
  channel: Channel,
  payload: ChannelPayloadMapper[Channel],
) => void;
export type ElectronOnFunc = <Channel extends keyof ChannelPayloadMapper>(
  channel: Channel,
  listener: (payload: ChannelPayloadMapper[Channel]) => void,
) => void;
export type ElectronInvokeFunc = <Channel extends keyof ChannelPayloadMapper>(
  channel: Channel,
  sentPayload: ChannelPayloadMapper[Channel] | null,
  callback: (payload: ChannelPayloadMapper[Channel]) => void,
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
  /**
   * Send a message to the main process via a specified channel and receive a response
   */
  invoke: ElectronInvokeFunc;
}
