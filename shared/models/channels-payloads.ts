import {Channels} from '../constants/channels';
import {FilePayload} from './file-models';

/**
 * Maps a channel to the type of payload sent by Angular
 */
export type AngularChannelPayloadMapper = {
  // angular payload
  [Channels.NewFileInvoke]: { isNext: boolean; selectedImagesDirPath: string };
  // electron payload
  [Channels.CurrentFileUpdate]: FilePayload;
  // electron payload
  [Channels.FolderPickerInvoke]: { path: string };
  [Channels.InitFilesInvoke]: { selectedImagesDirPath: string };
};

/**
 * Maps a channel to the type of payload sent by electron
 */
export type ElectronChannelPayloadMapper = {
  // angular payload
  [Channels.NewFileInvoke]: FilePayload | null;
  // electron payload
  [Channels.CurrentFileUpdate]: FilePayload;
  // electron payload
  [Channels.FolderPickerInvoke]: { path: string };
  [Channels.InitFilesInvoke]: FilePayload | null;
};

export type ElectronSendFunc = <
  Channel extends keyof AngularChannelPayloadMapper,
>(
  channel: Channel,
  payload: AngularChannelPayloadMapper[Channel],
) => void;
export type ElectronOnFunc = <
  Channel extends keyof AngularChannelPayloadMapper,
>(
  channel: Channel,
  listener: (payload: ElectronChannelPayloadMapper[Channel]) => void,
) => void;
export type ElectronInvokeFunc = <
  Channel extends keyof AngularChannelPayloadMapper,
>(
  channel: Channel,
  sentPayload: AngularChannelPayloadMapper[Channel] | null,
  callback: (payload: ElectronChannelPayloadMapper[Channel]) => void,
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
