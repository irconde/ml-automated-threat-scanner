import { Channels } from '../constants/channels';
import { FileAndDetectionSettings } from '../../electron/models/Settings';
import { FilePayload } from './file-models';

export type ChannelPayloadMapper = {
  [Channels.NewFileRequest]: boolean;
  [Channels.SettingsUpdate]: FileAndDetectionSettings;
  [Channels.CurrentFileUpdate]: FilePayload;
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
  send: ElectronSendFunc;
  on: ElectronOnFunc;
}
