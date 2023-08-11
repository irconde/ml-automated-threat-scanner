export interface CurrentFileUpdatePayload {
  fileName: string;
}


export type ChannelPayload = CurrentFileUpdatePayload;

export interface ElectronAPI {
  listenToCurrentFileUpdate: (callback: (payload: CurrentFileUpdatePayload) => void) => void
}
