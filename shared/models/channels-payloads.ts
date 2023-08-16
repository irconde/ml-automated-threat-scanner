export interface CurrentFileUpdatePayload {
  fileName: string;
  filesCount: number;
  pixelData?: ArrayBuffer;
}


export type ChannelPayload = CurrentFileUpdatePayload;

export interface ElectronAPI {
 send: (channel: string, ...args: any[]) => void;
 on: (channel: string, listener: (payload: ChannelPayload) => void) => void
}
