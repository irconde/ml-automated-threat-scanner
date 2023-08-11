export interface CurrentFileUpdatePayload {
  fileName: string;
  filesCount: number;
  pixelData?: ArrayBuffer;
}


export type ChannelPayload = CurrentFileUpdatePayload;

export interface ElectronAPI {
  listenToCurrentFileUpdate: (callback: (payload: CurrentFileUpdatePayload) => void) => void,
  invokeNewFileUpdate: (isNext: boolean) => void,
}
