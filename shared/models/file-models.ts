export interface BaseFile {
  fileName: string;
  filesCount: number;
  file: string;
}

export interface CurrentLocalDirectoryPayload extends BaseFile {
  // pixelData?: ArrayBuffer;
}

export interface CurrentRemoteServerPayload extends BaseFile {}

export type FilePayload =
  | CurrentLocalDirectoryPayload
  | CurrentRemoteServerPayload;
