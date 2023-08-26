export interface BaseFile {
  fileName: string;
  filesCount: number;
}

export interface CurrentLocalDirectoryPayload extends BaseFile {
  pixelData?: ArrayBuffer;
}

export interface CurrentRemoteServerPayload extends BaseFile {
  file: string;
}

export type FilePayload =
  | CurrentLocalDirectoryPayload
  | CurrentRemoteServerPayload;
